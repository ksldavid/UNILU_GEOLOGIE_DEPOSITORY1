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
            totalHours: c.totalHours || 45,
            isActive: c.isActive,
            isCompleted: c.isCompleted,
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
        const { code, name, academicLevelIds, totalHours = 45, isActive = false, academicYear = "2025-2026" } = req.body

        if (!code || !name || !academicLevelIds || !Array.isArray(academicLevelIds)) {
            return res.status(400).json({ message: 'Données manquantes : code, name ou academicLevelIds sont requis' })
        }

        // 1. Créer le cours
        const course = await prisma.course.create({
            data: {
                code,
                name,
                totalHours: Number(totalHours),
                isActive,
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
        console.error('❌ Erreur lors de la création du cours:', {
            error: error.message,
            stack: error.stack,
            data: req.body
        })
        res.status(500).json({
            message: 'Erreur serveur lors de la création du cours',
            error: error.message
        })
    }
}

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const code = req.params.code as string

        if (!code) {
            return res.status(400).json({ message: 'Code du cours requis' })
        }

        // Vérifier si le cours existe
        const existingCourse = await prisma.course.findUnique({
            where: { code }
        })

        if (!existingCourse) {
            return res.status(404).json({ message: 'Cours non trouvé' })
        }

        // Suppression manuelle en cascade sécurisée
        // On utilise une transaction pour tout supprimer ou rien du tout
        await prisma.$transaction(async (tx) => {
            // 1. Supprimer les inscriptions étudiants
            await tx.studentCourseEnrollment.deleteMany({
                where: { courseCode: code }
            })

            // 2. Supprimer les affectations du personnel
            await tx.courseEnrollment.deleteMany({
                where: { courseCode: code }
            })

            // 3. Supprimer les plannings hebdo
            await tx.schedule.deleteMany({
                where: { courseCode: code }
            })

            // 4. Supprimer les plannings d'examens/interros
            await tx.examSchedule.deleteMany({
                where: { courseCode: code }
            })

            // 5. Supprimer les présences (records puis sessions)
            // D'abord les records car ils dépendent des sessions
            await tx.attendanceRecord.deleteMany({
                where: { session: { courseCode: code } }
            })
            await tx.attendanceSession.deleteMany({
                where: { courseCode: code }
            })

            // 6. Supprimer les évaluations (grades, submissions, puis assessments)
            await tx.grade.deleteMany({
                where: { assessment: { courseCode: code } }
            })
            await tx.submission.deleteMany({
                where: { assessment: { courseCode: code } }
            })
            await tx.assessment.deleteMany({
                where: { courseCode: code }
            })

            // 7. Supprimer les ressources du cours
            await tx.courseResource.deleteMany({
                where: { courseCode: code }
            })

            // 8. Supprimer les annonces liées au cours
            await tx.announcement.deleteMany({
                where: { courseCode: code }
            })

            // 9. Supprimer les rattrapages (retakes)
            await tx.courseRetake.deleteMany({
                where: { courseCode: code }
            })

            // 10. Enfin, supprimer le cours lui-même
            await tx.course.delete({
                where: { code }
            })
        })

        res.json({ message: 'Cours et toutes les données associées supprimés avec succès' })
    } catch (error: any) {
        console.error('Erreur lors de la suppression du cours:', error)
        res.status(500).json({
            message: 'Erreur serveur lors de la suppression du cours',
            error: error.message
        })
    }
}

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const code = req.params.code as string
        const { name, totalHours, isActive, isCompleted } = req.body

        const updateData: any = {}
        if (name) updateData.name = name
        if (totalHours !== undefined) updateData.totalHours = Number(totalHours)
        if (isActive !== undefined) updateData.isActive = Boolean(isActive)
        if (isCompleted !== undefined) updateData.isCompleted = Boolean(isCompleted)

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour' })
        }

        const updatedCourse = await prisma.course.update({
            where: { code },
            data: updateData
        })

        res.json(updatedCourse)
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du cours:', error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}
