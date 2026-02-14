import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import { sendPushNotifications } from '../../utils/pushNotifications'

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, type, target, academicLevelId, courseCode, targetUserId } = req.body
        const authorId = req.user?.userId

        if (!authorId) {
            return res.status(401).json({ message: 'Auteur non identifié' })
        }

        const author = await prisma.user.findUnique({
            where: { id: authorId },
            select: { name: true }
        })

        console.log('📢 Tentative de création d\'annonce:', { title, target, academicLevelId, courseCode });

        // Clean values
        const cleanedAcademicLevelId = (academicLevelId !== undefined && academicLevelId !== null && academicLevelId !== '')
            ? parseInt(academicLevelId as string)
            : null

        const cleanedCourseCode = courseCode && courseCode.trim() !== '' ? courseCode : null
        const cleanedTargetUserId = targetUserId && targetUserId.trim() !== '' ? targetUserId : null

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
            },
            include: {
                course: { select: { name: true } },
                academicLevel: { select: { displayName: true } }
            }
        })

        // --- ENVOI DES NOTIFICATIONS PUSH ---
        try {
            let targetTokens: string[] = [];
            let notificationTitle = `📣 Nouvelle Annonce`;

            if (announcement.course) {
                notificationTitle = `📚 ${announcement.course.name}`;
            } else if (announcement.academicLevel) {
                notificationTitle = `🎓 ${announcement.academicLevel.displayName}`;
            }

            const authorLabel = author?.name ? `Pr. ${author.name}` : 'Espace Enseignant';

            // Identifier les destinataires
            if (target === 'GLOBAL') {
                const users = await prisma.user.findMany({
                    where: { pushToken: { not: null } },
                    select: { pushToken: true }
                });
                targetTokens = users.map(u => u.pushToken as string);
            } else if (target === 'ALL_STUDENTS') {
                const users = await prisma.user.findMany({
                    where: { systemRole: 'STUDENT', pushToken: { not: null } },
                    select: { pushToken: true }
                });
                targetTokens = users.map(u => u.pushToken as string);
            } else if (target === 'ALL_PROFESSORS') {
                const users = await prisma.user.findMany({
                    where: {
                        professorProfile: { isNot: null },
                        pushToken: { not: null }
                    },
                    select: { pushToken: true }
                });
                targetTokens = users.map(u => u.pushToken as string);
            } else if (target === 'ACADEMIC_SERVICE') {
                const users = await prisma.user.findMany({
                    where: {
                        OR: [
                            { systemRole: 'ACADEMIC_OFFICE' },
                            { academicProfile: { isNot: null } }
                        ],
                        pushToken: { not: null }
                    },
                    select: { pushToken: true }
                });
                targetTokens = users.map(u => u.pushToken as string);
            } else if (target === 'PROFESSORS_AND_ACADEMIC') {
                const users = await prisma.user.findMany({
                    where: {
                        OR: [
                            { professorProfile: { isNot: null } },
                            { systemRole: 'ACADEMIC_OFFICE' },
                            { academicProfile: { isNot: null } }
                        ],
                        pushToken: { not: null }
                    },
                    select: { pushToken: true }
                });
                targetTokens = users.map(u => u.pushToken as string);
            } else if (target === 'ACADEMIC_LEVEL' && cleanedAcademicLevelId !== null) {
                const users = await prisma.user.findMany({
                    where: {
                        studentEnrollments: { some: { academicLevelId: cleanedAcademicLevelId } },
                        pushToken: { not: null }
                    },
                    select: { pushToken: true }
                });
                targetTokens = users.map(u => u.pushToken as string);
            } else if (target === 'COURSE_STUDENTS' && cleanedCourseCode) {
                const enrollments = await prisma.studentCourseEnrollment.findMany({
                    where: {
                        courseCode: cleanedCourseCode,
                        isActive: true,
                        user: { pushToken: { not: null } }
                    },
                    include: { user: { select: { pushToken: true } } }
                });
                targetTokens = enrollments.map(e => e.user.pushToken as string);
            } else if (target === 'SPECIFIC_USER' && cleanedTargetUserId) {
                const user = await prisma.user.findUnique({
                    where: { id: cleanedTargetUserId },
                    select: { pushToken: true }
                });
                if (user?.pushToken) targetTokens = [user.pushToken];
            }

            if (targetTokens.length > 0) {
                await sendPushNotifications(targetTokens, {
                    title: notificationTitle,
                    body: `${authorLabel}: ${title}`,
                    data: {
                        type: 'ANNOUNCEMENT',
                        id: announcement.id,
                        courseCode: cleanedCourseCode
                    }
                });
            }
        } catch (pushError) {
            console.error('Erreur lors de l\'envoi des notifications push:', pushError);
            // On n'échoue pas la création de l'annonce si les push plantent
        }

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
        const { id } = req.params as { id: string };
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
        const { id } = req.params as { id: string };
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
