import { Request, Response } from 'express'
import prisma from '../../../prisma/client'

export const createExamSchedule = async (req: Request, res: Response) => {
    try {
        const { courseCode, academicLevelId, type, date, month, year, academicYear } = req.body;
        const creatorId = req.user?.id; // Assumes auth middleware populates req.user

        if (!creatorId) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

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
                creatorId
            }
        });

        res.status(201).json(newSchedule);
    } catch (error) {
        console.error('Erreur createExamSchedule:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du planning' });
    }
};

export const getExamSchedules = async (req: Request, res: Response) => {
    try {
        const { academicLevelId, month, year, courseCode } = req.query;

        let whereClause: any = {};

        if (academicLevelId) whereClause.academicLevelId = Number(academicLevelId);
        if (month) whereClause.month = Number(month);
        if (year) whereClause.year = Number(year);
        if (courseCode) whereClause.courseCode = String(courseCode);

        const schedules = await prisma.examSchedule.findMany({
            where: whereClause,
            include: {
                course: {
                    select: { name: true, professor: true, colorFrom: true, colorTo: true }
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

export const deleteExamSchedule = async (req: Request, res: Response) => {
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
