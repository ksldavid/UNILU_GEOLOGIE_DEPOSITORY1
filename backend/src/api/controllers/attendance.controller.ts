
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import crypto from 'crypto'

/**
 * Calcule la distance entre deux points en mètres (Formule de Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon de la terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
}

export const generateQRToken = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode, latitude, longitude } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non authentifié' });

        // 1. Vérifier si l'utilisateur enseigne ce cours
        const hasAccess = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode }
        });

        if (!hasAccess) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à générer un QR Code pour ce cours." });
        }

        // 2. Définir la date d'aujourd'hui (format YYYY-MM-DD)
        const now = new Date();
        const lubumbashiTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
        const todayStr = lubumbashiTime.toISOString().split('T')[0];
        const today = new Date(todayStr);

        // 3. Vérifier si une session existe déjà pour aujourd'hui
        // Si elle existe, on réutilise le MÊME token pour permettre l'impression à l'avance
        const existingSession = await (prisma as any).attendanceSession.findUnique({
            where: {
                courseCode_date: {
                    courseCode,
                    date: today
                }
            }
        });

        if (existingSession && !existingSession.isLocked && existingSession.qrToken) {
            // Optionnel: Mettre à jour la localisation si le prof est plus précis maintenant
            if (latitude && longitude) {
                await (prisma as any).attendanceSession.update({
                    where: { id: existingSession.id },
                    data: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude)
                    }
                });
            }

            return res.json({
                qrToken: existingSession.qrToken,
                sessionId: existingSession.id,
                expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
            });
        }

        // Sinon, on génère un nouveau token (première fois de la journée)
        const qrToken = crypto.randomBytes(32).toString('hex');

        const session = await (prisma as any).attendanceSession.upsert({
            where: {
                courseCode_date: {
                    courseCode,
                    date: today
                }
            },
            update: {
                qrToken,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                isLocked: false
            },
            create: {
                courseCode,
                date: today,
                qrToken,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                isLocked: false
            }
        });

        res.json({
            qrToken,
            sessionId: session.id,
            expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        });

    } catch (error) {
        console.error('Erreur génération QR:', error);
        res.status(500).json({ message: 'Erreur lors de la génération du QR Code' });
    }
}

export const scanQRToken = async (req: AuthRequest, res: Response) => {
    try {
        const { qrToken, latitude, longitude } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non authentifié' });

        // 1. Trouver la session par le token
        const session = await (prisma as any).attendanceSession.findUnique({
            where: { qrToken },
            include: { course: true }
        });

        if (!session) {
            return res.status(404).json({ message: "QR Code invalide ou expiré." });
        }

        if (session.isLocked) {
            return res.status(403).json({ message: "La prise de présence pour cette session est verrouillée." });
        }

        // 2. Vérifier la date (doit correspondre à la date de génération)
        const now = new Date();
        const lubumbashiTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
        const todayStr = lubumbashiTime.toISOString().split('T')[0];
        const sessionDateStr = new Date(session.date).toISOString().split('T')[0];

        if (todayStr !== sessionDateStr) {
            return res.status(403).json({
                message: "Ce QR Code ne correspond pas à la date d'aujourd'hui.",
                debug: { now: todayStr, session: sessionDateStr }
            });
        }

        // 3. Vérifier si l'étudiant est inscrit au cours (AVANT la distance)
        const isEnrolled = await prisma.studentCourseEnrollment.findFirst({
            where: {
                userId,
                courseCode: session.courseCode,
                isActive: true
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({
                message: `Vous n'êtes pas inscrit au cours "${session.course?.name || session.courseCode}". Veuillez contacter le service technique si vous pensez qu'il s'agit d'une erreur.`
            });
        }

        // 4. Vérifier la distance (si les positions sont disponibles)
        if (session.latitude && session.longitude && latitude && longitude) {
            const distance = calculateDistance(
                session.latitude,
                session.longitude,
                parseFloat(latitude),
                parseFloat(longitude)
            );

            // Rayon augmenté à 400m pour tenir compte des campus et murs épais
            if (distance > 400) {
                return res.status(403).json({
                    message: `Vous êtes trop loin du lieu du cours pour valider votre présence (Distance: ${Math.round(distance)}m). Vous devez être à moins de 400m du professeur.`,
                    distance: Math.round(distance)
                });
            }
        } else if (!latitude || !longitude) {
            return res.status(400).json({ message: "La géolocalisation est strictement requise pour valider la présence." });
        }

        // 5. Vérifier si l'étudiant a déjà pris présence aujourd'hui
        const existingAttendance = await (prisma as any).attendanceRecord.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId: session.id,
                    studentId: userId
                }
            }
        });

        // Si l'étudiant est déjà PRESENT ou LATE, on ne change rien
        if (existingAttendance && existingAttendance.status !== 'ABSENT') {
            return res.status(400).json({
                message: "Vous avez déjà pris présence pour ce cours aujourd'hui.",
                alreadyMarked: true,
                status: existingAttendance.status
            });
        }

        // 6. Enregistrer ou Mettre à jour la présence 
        await (prisma as any).attendanceRecord.upsert({
            where: {
                sessionId_studentId: {
                    sessionId: session.id,
                    studentId: userId
                }
            },
            update: { status: 'PRESENT' },
            create: {
                sessionId: session.id,
                studentId: userId,
                status: 'PRESENT'
            }
        });

        // 7. Calculer les statistiques pour le message de feedback
        const allCourseSessions = await prisma.attendanceSession.findMany({
            where: { courseCode: session.courseCode },
            select: { id: true }
        });
        const sessionIds = allCourseSessions.map(s => s.id);

        const studentAttendances = await prisma.attendanceRecord.count({
            where: {
                studentId: userId,
                sessionId: { in: sessionIds },
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        const totalSessions = allCourseSessions.length;
        const attendanceRate = totalSessions > 0 ? Math.round((studentAttendances / totalSessions) * 100) : 100;

        // 8. Générer le message de feedback personnalisé
        let feedbackMessage = `Présence validée ! Ton taux est de ${attendanceRate}%.`;

        if (attendanceRate <= 40) {
            feedbackMessage = `Présence validée ! Tu es à ${attendanceRate}% de présence. C'est un bon début, encore un petit effort et tu seras bien ! 💪`;
        } else if (attendanceRate <= 70) {
            feedbackMessage = `Bravo ! Ta présence est enregistrée. Tu as atteint ${attendanceRate}% de taux de présence. La régularité est la clé du succès ! 🚀`;
        } else if (attendanceRate <= 90) {
            feedbackMessage = `Superbe régularité ! Présence validée. Avec ${attendanceRate}%, tu es sur la voie de l'excellence. Garde ce rythme ! ✨`;
        } else {
            feedbackMessage = `Incroyable ! Ta présence est confirmée. ${attendanceRate}% de présence : tu es un étudiant modèle. Ne lâche rien ! 🏆`;
        }

        // 9. Envoyer aussi une notification Push pour confirmer
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true }
            });

            if (user?.pushToken) {
                const { sendPushNotifications } = require('../../utils/pushNotifications');
                await sendPushNotifications([user.pushToken], {
                    title: `✅ Présence confirmée (${attendanceRate}%)`,
                    body: feedbackMessage,
                    data: { type: 'ATTENDANCE_CONFIRMED', courseCode: session.courseCode }
                });
            }
        } catch (pushError) {
            console.error('[Push Attendance] Erreur:', pushError);
        }

        res.json({
            message: feedbackMessage,
            courseCode: session.courseCode,
            stats: {
                attendanceRate,
                totalPresent: studentAttendances,
                totalSessions
            }
        });

    } catch (error) {
        console.error('Erreur scan QR:', error);
        res.status(500).json({ message: 'Erreur lors de la validation de la présence' });
    }
}
