import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

// Récupérer tous les utilisateurs filtrés par rôle
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { role, academicLevelId } = req.query as { role?: string, academicLevelId?: string }

        // Construction du filtre
        const whereClause: any = {}
        if (role) {
            whereClause.systemRole = role
        }

        if (academicLevelId !== undefined && academicLevelId !== null && academicLevelId !== '') {
            whereClause.studentEnrollments = {
                some: {
                    academicLevelId: Number(academicLevelId)
                }
            }
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                systemRole: true,
                createdAt: true,
                isBlocked: true,
                // TOUJOURS récupérer les inscriptions académiques (niveau)
                studentEnrollments: {
                    take: 1,
                    orderBy: { enrolledAt: 'desc' },
                    select: {
                        academicLevel: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                // NOTE: Les présences (attendances) ne sont PAS chargées ici pour éviter un crash
                // (P5000 - Resource limit: 1800+ étudiants × N présences = trop lourd)
                // Le taux de présence par cours est calculé lors de l'ouverture d'un étudiant individuel.

                // Récupérer les cours auxquels l'étudiant est inscrit
                studentCourseEnrollments: {
                    select: {
                        course: {
                            select: {
                                name: true,
                                code: true,
                                _count: {
                                    select: {
                                        attendanceSessions: true
                                    }
                                }
                            }
                        }
                    }
                },
                // Récupérer les cours enseignés par le professeur
                enrollments: {
                    select: {
                        role: true,
                        academicYear: true,
                        course: {
                            select: {
                                code: true,
                                name: true,
                                academicLevels: {
                                    select: {
                                        displayName: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                },
                professorProfile: {
                    select: {
                        title: true
                    }
                },
                academicProfile: {
                    select: {
                        name: true,
                        title: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Formatage léger (sans calcul de présence, trop lourd pour 1800+ utilisateurs)
        const formattedUsers = users.map((u: any) => {
            if (u.systemRole === 'STUDENT') {
                const studentCourseEnrollments = u.studentCourseEnrollments?.map((enrollment: any) => ({
                    ...enrollment,
                    attendanceRate: 0 // Taux par défaut - calculé à la demande (détail étudiant)
                })) || [];

                return {
                    ...u,
                    studentCourseEnrollments,
                    _debugStudentEnrollments: u.studentEnrollments
                };
            }
            return u;
        });

        res.json(formattedUsers)

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Mettre à jour les informations d'un utilisateur
export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, email, title } = req.body

        // Mise à jour de l'utilisateur de base
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                // Si c'est un professeur, on met à jour son titre
                professorProfile: title ? {
                    upsert: {
                        create: { id, title },
                        update: { title }
                    }
                } : undefined
            },
            include: {
                professorProfile: true
            }
        })

        res.json({ message: 'Utilisateur mis à jour avec succès', user: updatedUser })
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

// Mettre à jour le jeton de notification push
export const updatePushToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId
        const { pushToken } = req.body

        if (!userId) {
            return res.status(401).json({ message: 'Non authentifié' })
        }

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        })

        res.json({ message: 'Push token mis à jour' })
    } catch (error: any) {
        console.error('Erreur push token:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}
