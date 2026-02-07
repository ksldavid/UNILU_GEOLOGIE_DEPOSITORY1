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
                // TOUJOURS récupérer les inscriptions
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
                // Récupérer les présences de l'étudiant pour calculer le taux
                attendances: {
                    select: {
                        status: true,
                        session: {
                            select: {
                                courseCode: true
                            }
                        }
                    }
                },
                // Récupérer les cours auxquels l'étudiant est inscrit + nombre total de sessions par cours
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

        // Calculer les taux de présence côté serveur pour chaque étudiant
        const formattedUsers = users.map((u: any) => {
            if (u.systemRole === 'STUDENT') {
                const studentCourseEnrollments = u.studentCourseEnrollments.map((enrollment: any) => {
                    const courseCode = enrollment.course.code;
                    const totalSessions = enrollment.course._count.attendanceSessions;

                    // On compte les présences (PRESENT ou LATE) pour ce cours spécifique
                    const presentCount = u.attendances.filter((a: any) =>
                        a.session.courseCode === courseCode &&
                        (a.status === 'PRESENT' || a.status === 'LATE')
                    ).length;

                    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

                    return {
                        ...enrollment,
                        attendanceRate
                    };
                });

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
