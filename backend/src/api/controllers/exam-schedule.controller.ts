import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

export const createExamSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, academicLevelId, type, date, month, year, academicYear, isPublished = false, room, duration } = req.body;
        const creatorId = req.user?.userId;
        const userRole = req.user?.role;

        if (!creatorId) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

        // --- NEW BUSINESS RULES ---
        if (userRole === 'USER' && type === 'EXAM') {
            return res.status(403).json({ error: "Les professeurs ne peuvent pas planifier d'examens finaux." });
        }
        if (userRole === 'ACADEMIC_OFFICE' && type === 'INTERROGATION') {
            return res.status(403).json({ error: "Le service académique ne planifie que les examens finaux. Les interrogations sont gérées par les professeurs." });
        }
        // --------------------------

        // Validate course
        const course = await prisma.course.findUnique({
            where: { code: courseCode }
        });

        if (!course) {
            return res.status(404).json({ error: 'Cours non trouvé' });
        }

        // Rule: Exam requires course to be completed
        if (type === 'EXAM' && !course.isCompleted) {
            return res.status(400).json({ error: "Impossible de planifier un EXAMEN : le cours n'est pas encore terminé." });
        }

        // Create the schedule
        const newSchedule = await prisma.examSchedule.create({
            data: {
                academicLevelId,
                courseCode,
                type,
                date: new Date(date),
                month,
                year,
                academicYear: academicYear || '2025-2026',
                creatorId,
                isPublished: Boolean(isPublished),
                room: room || null,
                duration: duration ? Number(duration) : null
            }
        });

        // --- NEW: Sync with Assessment if it's an Interrogation ---
        // (Exams usually have a different workflow for publishing results, 
        // but Interrogations can be auto-created as Assessments for grading)
        if (type === 'INTERROGATION') {
            try {
                // Check if an assessment already exists for this course and date
                const assessmentDate = new Date(date);
                const existingAssessment = await prisma.assessment.findFirst({
                    where: {
                        courseCode,
                        type: 'INTERROGATION',
                        date: {
                            gte: new Date(assessmentDate.setHours(0, 0, 0, 0)),
                            lte: new Date(assessmentDate.setHours(23, 59, 59, 999))
                        }
                    }
                });

                if (!existingAssessment) {
                    await prisma.assessment.create({
                        data: {
                            courseCode,
                            creatorId,
                            title: `Interrogation de ${course.name}`,
                            type: 'INTERROGATION',
                            maxPoints: 10, // Default to 10 as requested
                            date: new Date(date),
                            weight: 1.0,
                            isPublished: false
                        }
                    });
                }
            } catch (syncError) {
                console.error('[Schedule Sync] Erreur création épreuve auto:', syncError);
            }
        }

        res.status(201).json(newSchedule);
    } catch (error) {
        console.error('Erreur createExamSchedule:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du planning' });
    }
};

export const getExamSchedules = async (req: AuthRequest, res: Response) => {
    try {
        const { academicLevelId, month, year, courseCode } = req.query;

        let whereClause: any = {};

        if (academicLevelId !== undefined) whereClause.academicLevelId = Number(academicLevelId);
        if (month !== undefined) whereClause.month = Number(month);
        if (year !== undefined) whereClause.year = Number(year);
        if (courseCode !== undefined) whereClause.courseCode = String(courseCode);

        // Filter based on user role
        if (req.user?.role === 'STUDENT') {
            whereClause.isPublished = true;

            // Masquer les examens passés pour les étudiants
            whereClause.date = {
                gte: new Date()
            };

            // Get courses the student is enrolled in
            const studentEnrollments = await prisma.studentCourseEnrollment.findMany({
                where: { userId: req.user.userId },
                select: { courseCode: true }
            });

            const enrolledCourseCodes = studentEnrollments.map(e => e.courseCode);

            if (enrolledCourseCodes.length > 0) {
                whereClause.courseCode = { in: enrolledCourseCodes };
            } else {
                // If they have no course enrollment, they see nothing
                return res.json([]);
            }
        } else if (req.user?.role === 'USER') {
            // Professors (role USER) only see their OWN interrogations
            whereClause.type = 'INTERROGATION';
            whereClause.creatorId = req.user.userId;
        }
        // ACADEMIC_OFFICE sees everything: no extra filter needed

        const schedules = await prisma.examSchedule.findMany({
            where: whereClause,
            include: {
                course: {
                    select: { name: true }
                },
                academicLevel: {
                    select: { name: true, displayName: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        res.json(schedules);
    } catch (error) {
        console.error('Erreur getExamSchedules:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des plannings' });
    }
};

export const updateExamSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { date, isPublished, room, duration } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Non autorisé' });

        const updated = await prisma.examSchedule.update({
            where: { id: Number(id) },
            data: {
                ...(date && { date: new Date(date) }),
                ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
                ...(room !== undefined && { room: room || null }),
                ...(duration !== undefined && { duration: duration ? Number(duration) : null })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Erreur updateExamSchedule:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

export const deleteExamSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.examSchedule.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Planning supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteExamSchedule:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du planning' });
    }
};
