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
                },
                academicLevels: {
                    select: {
                        id: true,
                        displayName: true,
                        code: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        const formattedCourses = courses.map((c: any) => ({
            id: c.code, // Utilise le code comme ID pour le planning
            name: c.name,
            code: c.code,
            professor: c.enrollments?.[0]?.user?.name || 'À définir',
            academicLevels: c.academicLevels,
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

export const createCourse = async (req: Request, res: Response) => {
    try {
        const { code, name, academicLevelIds, academicYear = "2025-2026" } = req.body

        if (!code || !name || !academicLevelIds || !Array.isArray(academicLevelIds)) {
            return res.status(400).json({ message: 'Données manquantes : code, name ou academicLevelIds sont requis' })
        }

        // 1. Créer le cours
        const course = await prisma.course.create({
            data: {
                code,
                name,
                academicLevels: {
                    connect: academicLevelIds.map((id: number) => ({ id }))
                }
            }
        })

        // 2. Inscription automatique des étudiants
        // Récupérer tous les étudiants inscrits à ces niveaux académiques pour CETTE année
        const students = await prisma.studentEnrollment.findMany({
            where: {
                academicLevelId: { in: academicLevelIds },
                academicYear: academicYear
            }
        })

        if (students.length > 0) {
            await prisma.studentCourseEnrollment.createMany({
                data: students.map(s => ({
                    userId: s.userId,
                    courseCode: code,
                    academicYear: academicYear,
                    isActive: true
                })),
                skipDuplicates: true
            })
        }

        res.status(201).json(course)
    } catch (error: any) {
        console.error('Erreur lors de la création du cours:', error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const code = req.params.code as string
        const { name } = req.body

        if (!name) {
            return res.status(400).json({ message: 'Le nom du cours est requis pour la mise à jour' })
        }

        const updatedCourse = await prisma.course.update({
            where: { code },
            data: { name }
        })

        res.json(updatedCourse)
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du cours:', error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}
