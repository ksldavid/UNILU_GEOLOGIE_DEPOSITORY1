import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, type, target, academicLevelId, courseCode, targetUserId } = req.body
        const authorId = req.user?.userId

        if (!authorId) {
            return res.status(401).json({ message: 'Auteur non identifié' })
        }

        console.log('📢 Tentative de création d\'annonce:', { title, target, academicLevelId, courseCode });

        // Clean values to avoid foreign key violations with empty strings
        // Correction: On vérifie explicitement null/undefined car academicLevelId peut être 0 (Presciences)
        const cleanedAcademicLevelId = (academicLevelId !== undefined && academicLevelId !== null && academicLevelId !== '')
            ? parseInt(academicLevelId as string)
            : null

        const cleanedCourseCode = courseCode && courseCode.trim() !== '' ? courseCode : null
        const cleanedTargetUserId = targetUserId && targetUserId.trim() !== '' ? targetUserId : null

        console.log('🧼 Valeurs nettoyées:', { cleanedAcademicLevelId, cleanedCourseCode, cleanedTargetUserId });

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'GENERAL',
                target: target as any,
                authorId,
                academicLevelId: cleanedAcademicLevelId,
                courseCode: cleanedCourseCode,
                targetUserId: cleanedTargetUserId,
                isActive: true
            }
        })

        res.status(201).json({
            message: 'Annonce publiée avec succès',
            announcement
        })
    } catch (error: any) {
        console.error('Erreur création annonce:', error)

        // Log extra detail if it's a Prisma error
        if (error.code === 'P2003') {
            console.error('Détail erreur: Violation de contrainte étrangère (cible inexistante)')
        }

        res.status(500).json({
            message: 'Erreur lors de la publication de l\'annonce',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
}

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany({
            include: {
                author: { select: { name: true } },
                academicLevel: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(announcements)
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' })
    }
}
export const getMyAnnouncements = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.user?.userId;
        if (!authorId) return res.status(401).json({ message: 'Non autorisé' });

        const announcements = await prisma.announcement.findMany({
            where: { authorId },
            include: {
                academicLevel: { select: { displayName: true, name: true } },
                course: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (error) {
        console.error('Erreur getMyAnnouncements:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, type, target, academicLevelId, courseCode, targetUserId } = req.body;
        const userId = req.user?.userId;

        // Verify authorship
        const existing = await prisma.announcement.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ message: 'Annonce non trouvée' });
        if (existing.authorId !== userId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Non autorisé à modifier cette annonce' });
        }

        const cleanedAcademicLevelId = (academicLevelId !== undefined && academicLevelId !== null && academicLevelId !== '')
            ? parseInt(academicLevelId as string)
            : null

        const updated = await prisma.announcement.update({
            where: { id: parseInt(id) },
            data: {
                title,
                content,
                type,
                target,
                academicLevelId: cleanedAcademicLevelId,
                courseCode: courseCode || null,
                targetUserId: targetUserId || null
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Erreur updateAnnouncement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const existing = await prisma.announcement.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ message: 'Annonce non trouvée' });
        if (existing.authorId !== userId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Non autorisé à supprimer cette annonce' });
        }

        // 1. Supprimer d'abord les reçus de lecture pour éviter les erreurs de contrainte (FK)
        await prisma.announcementRead.deleteMany({ where: { announcementId: parseInt(id) } });

        // 2. Supprimer l'annonce
        await prisma.announcement.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Annonce supprimée' });
    } catch (error) {
        console.error('Erreur deleteAnnouncement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
