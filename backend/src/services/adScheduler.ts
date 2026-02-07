import prisma from '../lib/prisma';
import { sendPushNotifications } from '../utils/pushNotifications';

/**
 * Robot qui vérifie les publicités programmées toutes les minutes
 */
export const startAdScheduler = () => {
    console.log('--- [ROBOT PUB] Démarrage du planificateur de notifications ---');

    // On tourne toutes les 60 secondes
    setInterval(async () => {
        try {
            const now = new Date();
            // Format HH:mm (ex: "14:30")
            const currentTime = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            console.log(`[ROBOT PUB] Vérification pour ${currentTime}...`);

            // 1. Trouver les pubs actives qui ont cette heure dans leur planning
            const adsToSend = await prisma.advertisement.findMany({
                where: {
                    isActive: true,
                    scheduledTimes: { has: currentTime },
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } }
                    ]
                }
            });

            for (const ad of adsToSend) {
                // 2. Vérifier si le quota journalier est atteint
                const isSentToday = ad.lastSentAt &&
                    ad.lastSentAt.toDateString() === now.toDateString();

                let currentSentCount = isSentToday ? ad.sentToday : 0;

                if (currentSentCount < ad.dailyLimit) {
                    console.log(`[ROBOT PUB] Envoi automatique pour: ${ad.title}`);

                    // 3. Récupérer les tokens
                    const users = await prisma.user.findMany({
                        where: { pushToken: { not: null }, isBlocked: false },
                        select: { pushToken: true }
                    });
                    const tokens = users.map(u => u.pushToken as string).filter(t => t);

                    if (tokens.length > 0) {
                        await sendPushNotifications(tokens, {
                            title: ad.pushTitle || ad.title,
                            body: ad.pushBody || "Découvrez notre nouvelle offre !",
                            data: { type: 'ADVERTISEMENT', link: ad.linkUrl }
                        });

                        // 4. Mettre à jour les stats
                        await prisma.advertisement.update({
                            where: { id: ad.id },
                            data: {
                                sentToday: isSentToday ? { increment: 1 } : 1,
                                lastSentAt: now
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[ROBOT PUB] Erreur:', error);
        }
    }, 60000); // 60 secondes
};
