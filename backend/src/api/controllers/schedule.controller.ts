import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

// Récupérer le planning pour un niveau académique et une année donnée
export const getSchedule = async (req: Request, res: Response) => {
    try {
        const { academicLevelId, academicYear } = req.query

        if (academicLevelId === undefined || academicLevelId === null || !academicYear) {
            return res.status(400).json({ message: 'academicLevelId et academicYear sont requis' })
        }

        const schedules = await prisma.schedule.findMany({
            where: {
                academicLevelId: Number(academicLevelId),
                academicYear: String(academicYear)
            },
            include: {
                course: {
                    select: {
                        name: true,
                        code: true,
                        enrollments: {
                            where: {
                                academicYear: String(academicYear),
                                role: 'PROFESSOR'
                            },
                            select: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Formater pour le front
        const formattedSchedules = schedules.map(s => ({
            id: s.id.toString(),
            courseCode: s.courseCode,
            name: s.course.name,
            code: s.course.code,
            professor: s.course.enrollments[0]?.user.name || 'À définir',
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room,
            color: '#1B4332' // Couleur par défaut
        }))

        res.json(formattedSchedules)
    } catch (error) {
        console.error('Erreur lors de la récupération du planning:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

// Sauvegarder/Mettre à jour le planning complet pour un niveau
export const saveSchedule = async (req: Request, res: Response) => {
    try {
        const { academicLevelId, academicYear, schedules } = req.body

        if (academicLevelId === undefined || academicLevelId === null || !academicYear || !Array.isArray(schedules)) {
            return res.status(400).json({ message: 'Données invalides' })
        }

        // On utilise une transaction pour supprimer l'ancien planning et mettre le nouveau
        await prisma.$transaction([
            prisma.schedule.deleteMany({
                where: {
                    academicLevelId: Number(academicLevelId),
                    academicYear: String(academicYear)
                }
            }),
            prisma.schedule.createMany({
                data: schedules.map((s: { code: string; day: string; startTime: string; endTime: string; room: string }) => ({
                    academicLevelId: Number(academicLevelId),
                    academicYear: String(academicYear),
                    courseCode: s.code,
                    day: s.day,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    room: s.room
                }))
            })
        ])

        res.json({ message: 'Planning enregistré avec succès' })
    } catch (error: any) {
        console.error('Erreur lors de la sauvegarde du planning:', error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}
