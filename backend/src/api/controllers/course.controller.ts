import { Request, Response } from 'express'
import prisma from '../../lib/prisma'

export const getCourses = async (req: Request, res: Response) => {
    try {
        const { academicLevelId } = req.query

        const whereClause: any = {}
        if (academicLevelId !== undefined && academicLevelId !== null) {
            whereClause.academicLevels = {
                some: {
                    id: Number(academicLevelId)
                }
            }
        }

        const courses = await prisma.course.findMany({
            where: whereClause,
            include: {
                enrollments: {
                    where: {
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
            },
            orderBy: {
                name: 'asc'
            }
        })

        const formattedCourses = courses.map(c => ({
            id: c.code, // Utilise le code comme ID pour le planning
            name: c.name,
            code: c.code,
            professor: c.enrollments[0]?.user.name || 'À définir',
            color: '#1B4332'
        }))

        res.json(formattedCourses)
    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const getAcademicLevels = async (req: Request, res: Response) => {
    try {
        const levels = await prisma.academicLevel.findMany({
            orderBy: {
                order: 'asc'
            }
        })
        res.json(levels)
    } catch (error) {
        console.error('Erreur lors de la récupération des niveaux:', error)
        res.status(500).json({ message: 'Erreur serveur' })
    }
}
