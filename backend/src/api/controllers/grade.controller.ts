import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

// Récupérer toutes les demandes de changement de notes
export const getGradeChangeRequests = async (req: Request, res: Response) => {
    try {
        const { status } = req.query

        const requests = await prisma.gradeChangeRequest.findMany({
            where: status ? { status: status as any } : {},
            include: {
                requester: {
                    select: {
                        name: true
                    }
                },
                grade: {
                    include: {
                        student: {
                            select: {
                                name: true
                            }
                        },
                        assessment: {
                            include: {
                                course: {
                                    select: {
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // On formate pour le frontend
        const formattedRequests = requests.map(req => ({
            id: req.id.toString(),
            professor: req.requester.name,
            professorInitials: req.requester.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            student: req.grade.student.name,
            course: req.grade.assessment.course.name,
            courseCode: req.grade.assessment.course.code,
            oldGrade: req.grade.score.toString(),
            newScore: req.newScore.toString(), // Note: Frontend use newGrade, but model use newScore
            newGrade: req.newScore.toString(),
            justification: req.reason,
            date: req.createdAt.toISOString().split('T')[0],
            status: req.status.toLowerCase(),
            rejectionReason: req.status === 'REJECTED' ? 'Refusé par le service académique' : undefined // Basic status label
        }))

        res.json(formattedRequests)
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes de notes:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Mettre à jour le statut d'une demande (Approuver/Refuser)
export const updateGradeChangeRequestStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { status, reason } = req.body

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' })
        }

        const request = await prisma.gradeChangeRequest.update({
            where: { id: Number(id) },
            data: {
                status,
                resolvedAt: new Date(),
                // Si on voulait enregistrer la raison du refus, il faudrait ajouter un champ au modèle Prisma ou l'utiliser comme feedback
            }
        })

        // Si approuvé, on met à jour la note réelle dans la table Grade
        if (status === 'APPROVED') {
            await prisma.grade.update({
                where: { id: request.gradeId },
                data: {
                    score: request.newScore,
                    updatedAt: new Date()
                }
            })
        }

        res.json({ message: `Demande ${status.toLowerCase()} avec succès` })
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande de note:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les statistiques de rectifications (Top cours)
export const getGradesStats = async (req: Request, res: Response) => {
    try {
        const stats = await prisma.gradeChangeRequest.groupBy({
            by: ['gradeId'],
            _count: {
                id: true
            },
            where: {
                status: 'PENDING'
            }
        });

        // Pour avoir les noms des cours, on doit faire une requête complémentaire ou un join manuel
        const detailedStats = await Promise.all(stats.map(async (item) => {
            const grade = await prisma.grade.findUnique({
                where: { id: item.gradeId },
                include: {
                    assessment: {
                        include: {
                            course: true
                        }
                    }
                }
            });
            return {
                course: `${grade?.assessment.course.name} (${grade?.assessment.course.code})`,
                count: item._count.id
            };
        }));

        res.json(detailedStats.sort((a, b) => b.count - a.count).slice(0, 5));
    } catch (error) {
        console.error('Erreur stats notes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Récupérer les notes pour un PV (Par cours et promotion)
export const getCourseGrades = async (req: Request, res: Response) => {
    try {
        const { courseCode, academicYear } = req.query

        if (!courseCode || !academicYear) {
            return res.status(400).json({ message: 'courseCode et academicYear sont requis' })
        }

        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                courseCode: String(courseCode),
                academicYear: String(academicYear),
                isActive: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        grades: {
                            where: {
                                assessment: {
                                    courseCode: String(courseCode)
                                }
                            },
                            include: {
                                assessment: true,
                                changeRequests: {
                                    where: {
                                        status: 'PENDING'
                                    },
                                    include: {
                                        requester: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const assessments = await prisma.assessment.findMany({
            where: {
                courseCode: String(courseCode)
            },
            orderBy: {
                date: 'asc'
            }
        })

        const pvData = enrollments.map(en => {
            const studentGrades: any = {}
            const pendingRequests: any = {}

            en.user.grades.forEach(g => {
                studentGrades[g.assessmentId] = g.score
                if ((g as any).changeRequests && (g as any).changeRequests.length > 0) {
                    pendingRequests[g.assessmentId] = {
                        requestId: (g as any).changeRequests[0].id,
                        newScore: (g as any).changeRequests[0].newScore,
                        reason: (g as any).changeRequests[0].reason,
                        professor: (g as any).changeRequests[0].requester.name
                    }
                }
            })

            return {
                studentId: en.user.id,
                studentName: en.user.name,
                grades: studentGrades,
                pendingRequests
            }
        })

        res.json({
            assessments,
            pvData
        })
    } catch (error) {
        console.error('Erreur lors de la génération du PV:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}
