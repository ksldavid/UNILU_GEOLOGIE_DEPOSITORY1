import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

// Statistiques pour le dashboard du service académique
export const getAcademicStats = async (req: Request, res: Response) => {
    try {
        // 1. Nombre total d'étudiants
        const studentCount = await prisma.user.count({
            where: {
                systemRole: 'STUDENT',
                isArchived: false
            }
        })

        // 2. Nombre de professeurs (users with professorProfile)
        const professorCount = await prisma.user.count({
            where: {
                professorProfile: {
                    isNot: null
                },
                isArchived: false
            }
        })

        // 3. Nombre total de cours
        const courseCount = await prisma.course.count()

        // 4. Nombre de demandes de changement de notes en attente
        const pendingGradeChangeRequests = await prisma.gradeChangeRequest.count({
            where: {
                status: 'PENDING'
            }
        })

        res.json({
            studentCount,
            professorCount,
            courseCount,
            pendingGradeChangeRequests
        })

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer les activités récentes
export const getRecentActivities = async (req: Request, res: Response) => {
    try {
        const activities: any[] = []

        // 1. Nouvelles inscriptions (Derniers étudiants créés)
        const recentStudents = await prisma.user.findMany({
            where: { systemRole: 'STUDENT' },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
                id: true,
                name: true,
                createdAt: true,
                studentEnrollments: {
                    take: 1,
                    select: { academicLevel: { select: { name: true } } }
                }
            }
        })

        recentStudents.forEach(s => {
            activities.push({
                id: `student-${s.id}`,
                user: s.name,
                action: 'Nouvelle inscription validée',
                detail: s.studentEnrollments[0]?.academicLevel?.name || 'Géologie',
                time: s.createdAt,
                type: 'STUDENT'
            })
        })

        // 2. Rectifications de notes (Dernières demandes)
        const recentGrades = await prisma.gradeChangeRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
                requester: { select: { name: true } },
                grade: {
                    include: {
                        assessment: {
                            include: { course: { select: { name: true } } }
                        }
                    }
                }
            }
        })

        recentGrades.forEach(g => {
            activities.push({
                id: `grade-${g.id}`,
                user: g.requester.name,
                action: g.status === 'PENDING' ? 'Demande de rectification' : `Note ${g.status === 'APPROVED' ? 'approuvée' : 'refusée'}`,
                detail: g.grade.assessment.course.name,
                time: g.createdAt,
                type: 'GRADE'
            })
        })

        // 3. Planning (Dernières modifications)
        const recentSchedules = await prisma.schedule.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 3,
            select: {
                id: true,
                updatedAt: true,
                course: { select: { name: true } },
                academicLevel: { select: { name: true } }
            }
        })

        recentSchedules.forEach(sch => {
            activities.push({
                id: `schedule-${sch.id}`,
                user: 'Service Académique',
                action: 'Modification de planning',
                detail: `${sch.course.name} - ${sch.academicLevel.name}`,
                time: sch.updatedAt,
                type: 'SCHEDULE'
            })
        })

        // 4. Changements de présence (AttendanceChangeRequest)
        const recentAttendanceRequests = await prisma.attendanceChangeRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
                requester: { select: { name: true } },
                attendance: {
                    include: {
                        student: { select: { name: true } },
                        session: { include: { course: { select: { name: true } } } }
                    }
                }
            }
        })

        recentAttendanceRequests.forEach(ar => {
            activities.push({
                id: `attendance-${ar.id}`,
                user: ar.requester.name,
                action: 'Demande changement présence',
                detail: `${ar.attendance.student.name} - ${ar.attendance.session.course.name}`,
                time: ar.createdAt,
                type: 'ATTENDANCE'
            })
        })

        // Trier par date décroissante
        const sortedActivities = activities
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10)

        res.json(sortedActivities)
    } catch (error) {
        console.error('Erreur activités récentes:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Statistiques de présence par niveau académique pour le graphique
export const getAttendanceStatsByLevel = async (req: Request, res: Response) => {
    try {
        const months = ["Janv.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
        const results = [];

        // Niveaux ciblés : 0 (Prescience), 1 (B1), 2 (B2), 3 (B3)
        const levels = [
            { id: 0, key: 'prescience' },
            { id: 1, key: 'b1' },
            { id: 2, key: 'b2' },
            { id: 3, key: 'b3' }
        ];

        // On va générer des données pour chaque mois
        // En prod, on ferait des agrégations Prisma, ici on simule une agrégation réaliste
        // basée sur les sessions existantes si possible, sinon on met des valeurs par défaut

        const currentYear = new Date().getFullYear();

        for (let i = 0; i < months.length; i++) {
            const monthData: any = { month: months[i] };

            for (const level of levels) {
                // Tentative de calcul réel en passant par les cours liés au niveau académique
                const whereClause = {
                    session: {
                        course: {
                            academicLevels: {
                                some: { id: level.id }
                            }
                        },
                        date: {
                            gte: new Date(currentYear, i, 1),
                            lt: new Date(currentYear, i + 1, 1)
                        }
                    }
                };

                const attendanceCount = await prisma.attendanceRecord.count({
                    where: {
                        ...whereClause,
                        status: 'PRESENT'
                    }
                });

                const totalAttempts = await prisma.attendanceRecord.count({
                    where: whereClause
                });

                // Si pas de données, on met 0 (Vraie donnée : pas d'assiduité enregistrée)
                if (totalAttempts === 0) {
                    monthData[level.key] = 0;
                } else {
                    monthData[level.key] = Math.round((attendanceCount / totalAttempts) * 100);
                }
            }
            results.push(monthData);
        }

        res.json(results);
    } catch (error) {
        console.error('Erreur stats présence:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Récupérer l'assiduité réelle de chaque étudiant pour un cours donné
export const getCourseAttendance = async (req: Request, res: Response) => {
    try {
        const { courseCode, academicLevelId } = req.query as { courseCode: string, academicLevelId: string }
        const academicYear = "2025-2026" // Dynamique plus tard si besoin

        if (!courseCode || !academicLevelId) {
            return res.status(400).json({ message: 'courseCode et academicLevelId sont requis' })
        }

        // 1. Récupérer les étudiants inscrits à ce niveau
        const students = await prisma.user.findMany({
            where: {
                systemRole: 'STUDENT',
                isArchived: false,
                studentEnrollments: {
                    some: { academicLevelId: Number(academicLevelId), academicYear }
                }
            },
            select: {
                id: true,
                name: true
            },
            orderBy: { name: 'asc' }
        })

        // 2. Récupérer toutes les sessions d'appel pour ce cours cette année
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                courseCode,
                date: {
                    gte: new Date(new Date().getFullYear(), 0, 1), // Depuis le début de l'année
                }
            },
            select: { id: true }
        })
        // Note: Si le champ academicYear n'est pas sur AttendanceSession, on filtre par date ou on l'ajoute.
        // Vérifions le schéma AttendanceSession... lignes 322-330 : il n'y est pas.

        const sessionIds = sessions.map(s => s.id)

        // 3. Pour chaque étudiant, calculer son taux de présence
        const results = await Promise.all(students.map(async (student) => {
            const records = await prisma.attendanceRecord.findMany({
                where: {
                    studentId: student.id,
                    sessionId: { in: sessionIds }
                },
                select: { status: true }
            })

            const total = sessionIds.length
            const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length

            return {
                id: student.id,
                name: student.name,
                attendance: total > 0 ? Math.round((present / total) * 100) : 0
            }
        }))

        res.json(results)

    } catch (error) {
        console.error('Erreur assiduité cours:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}
