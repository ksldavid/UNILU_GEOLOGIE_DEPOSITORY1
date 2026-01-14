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

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'GENERAL',
                target,
                authorId,
                academicLevelId: academicLevelId ? parseInt(academicLevelId) : null,
                courseCode,
                targetUserId,
                isActive: true
            }
        })

        res.status(201).json({
            message: 'Annonce publiée avec succès',
            announcement
        })
    } catch (error) {
        console.error('Erreur création annonce:', error)
        res.status(500).json({ message: 'Erreur lors de la publication de l\'annonce' })
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
        const { title, content, type, target, academicLevelId } = req.body;
        const userId = req.user?.userId;

        // Verify authorship
        const existing = await prisma.announcement.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ message: 'Annonce non trouvée' });
        if (existing.authorId !== userId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Non autorisé à modifier cette annonce' });
        }

        const updated = await prisma.announcement.update({
            where: { id: parseInt(id) },
            data: {
                title,
                content,
                type,
                target,
                academicLevelId: academicLevelId ? parseInt(academicLevelId) : null
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

        await prisma.announcement.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Annonce supprimée' });
    } catch (error) {
        console.error('Erreur deleteAnnouncement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
