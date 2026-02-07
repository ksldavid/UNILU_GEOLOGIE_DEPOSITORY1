import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { sendPushNotifications } from '../../utils/pushNotifications'
import { uploadToCloudinary } from '../../utils/cloudinaryHelper'

/**
 * Récupérer TOUTES les publicités pour le panel admin
 */
export const getAllAds = async (req: Request, res: Response) => {
    try {
        const ads = await prisma.advertisement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(ads);
    } catch (error) {
        console.error('Erreur récupération toutes les pubs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

/**
 * Récupérer les publicités actives pour le carousel mobile
 */
export const getActiveAds = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const ads = await prisma.advertisement.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ads);
    } catch (error) {
        console.error('Erreur récupération pubs:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des publicités' });
    }
}

/**
 * Créer une nouvelle publicité (Panel Technique)
 */
export const createAd = async (req: Request, res: Response) => {
    try {
        const { title, linkUrl, dailyLimit, pushTitle, pushBody, description, durationDays, targetPushCount } = req.body;
        let imageUrl = req.body.imageUrl;

        // Si une image est uploadée, on l'envoie sur Cloudinary
        if (req.file) {
            const folder = 'unilu/ads';
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, folder, `ad_${Date.now()}`);
            imageUrl = cloudinaryResult.secure_url;
        }

        if (!imageUrl) {
            return res.status(400).json({ message: 'Une image est obligatoire pour la publicité' });
        }

        // Calcul de la date d'expiration si une durée est fournie
        let expiresAt = null;
        if (durationDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));
        }

        const ad = await prisma.advertisement.create({
            data: {
                title,
                imageUrl,
                linkUrl,
                dailyLimit: parseInt(dailyLimit) || 1,
                pushTitle,
                pushBody,
                description,
                expiresAt,
                targetPushCount: parseInt(targetPushCount) || 0,
                isActive: true
            }
        });

        res.status(201).json(ad);
    } catch (error) {
        console.error('Erreur création pub:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la publicité' });
    }
}

/**
 * Mettre à jour une publicité
 */
export const updateAd = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const data = req.body;

        const ad = await prisma.advertisement.update({
            where: { id },
            data
        });

        res.json(ad);
    } catch (error) {
        console.error('Erreur update pub:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
}

/**
 * Supprimer une publicité
 */
export const deleteAd = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.advertisement.delete({ where: { id } });
        res.json({ message: 'Publicité supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur suppression' });
    }
}

/**
 * Déclencher manuellement les notifications pour une publicité (Service Technique)
 * Cette fonction respecte la limite quotidienne configurée.
 */
export const triggerAdNotifications = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        const ad = await prisma.advertisement.findUnique({ where: { id } });
        if (!ad) return res.status(404).json({ message: 'Publicité non trouvée' });

        // Reset logic if today is a different day than lastSentAt
        const now = new Date();
        const isContentDifferentDay = ad.lastSentAt &&
            (ad.lastSentAt.getDate() !== now.getDate() ||
                ad.lastSentAt.getMonth() !== now.getMonth() ||
                ad.lastSentAt.getFullYear() !== now.getFullYear());

        let currentSentToday = ad.sentToday;
        if (isContentDifferentDay) {
            currentSentToday = 0;
            // No need to update DB yet, we'll do it after sending
        }

        if (currentSentToday >= ad.dailyLimit) {
            return res.status(400).json({
                message: `Limite quotidienne atteinte (${currentSentToday}/${ad.dailyLimit}).`
            });
        }

        // Récupérer tous les utilisateurs avec un pushToken
        const users = await prisma.user.findMany({
            where: {
                pushToken: { not: null },
                isBlocked: false
            },
            select: { pushToken: true }
        });

        const tokens = users.map(u => u.pushToken as string).filter(t => t);

        if (tokens.length > 0) {
            await sendPushNotifications(tokens, {
                title: ad.pushTitle || ad.title,
                body: ad.pushBody || "Découvrez notre nouvelle offre !",
                data: { type: 'ADVERTISEMENT', link: ad.linkUrl }
            });

            // Mettre à jour le compteur (réglé sur 1 si c'était un nouveau jour, sinon incrémenté)
            await prisma.advertisement.update({
                where: { id },
                data: {
                    sentToday: isContentDifferentDay ? 1 : { increment: 1 },
                    lastSentAt: new Date()
                }
            });
        }

        res.json({
            message: `Notification envoyée à ${tokens.length} étudiants.`,
            stats: {
                sentToday: isContentDifferentDay ? 1 : ad.sentToday + 1,
                limit: ad.dailyLimit
            }
        });

    } catch (error) {
        console.error('Erreur notification pub:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi des notifications' });
    }
}
/**
 * Enregistrer un clic sur le lien d'une publicité
 */
export const trackClick = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.advertisement.update({
            where: { id },
            data: { clickCount: { increment: 1 } }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur track click:', error);
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement du clic' });
    }
}
