
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import crypto from 'crypto'

// Coordonnées autorisées de la Faculté (Bâtiment Géologie et environs)
const FACULTY_LOCATIONS = [
    { lat: -11.6306702, lng: 27.4848642 }, // Point principal (Géologie)
    { lat: -11.630693, lng: 27.485245 },  // Extension Est
    { lat: -11.630788, lng: 27.484503 }   // Extension Ouest
];

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
        const { courseCode } = req.body;
        // On utilise maintenant une localisation par défaut
        const latitude = FACULTY_LOCATIONS[0].lat;
        const longitude = FACULTY_LOCATIONS[0].lng;

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
        const existingSession = await (prisma as any).attendanceSession.findUnique({
            where: {
                courseCode_date: {
                    courseCode,
                    date: today
                }
            }
        });

        // Si une session existe déjà avec un token, on le renvoie TOUJOURS
        // même si la session était verrouillée par erreur, on la déverrouille pour le scan
        if (existingSession && existingSession.qrToken) {
            // Optionnel: On s'assure qu'elle est déverrouillée si le prof demande à nouveau le QR
            if (existingSession.isLocked) {
                await (prisma as any).attendanceSession.update({
                    where: { id: existingSession.id },
                    data: { isLocked: false }
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
                // IMPORTANT: On ne change JAMAIS le qrToken si par miracle il est apparu entre temps
                qrToken: existingSession?.qrToken || qrToken,
                latitude,
                longitude,
                isLocked: false
            },
            create: {
                courseCode,
                date: today,
                qrToken,
                latitude,
                longitude,
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
        console.log(`[SCAN DEBUG] Recherche session pour token: ${qrToken?.substring(0, 8)}...`);
        const session = await (prisma as any).attendanceSession.findUnique({
            where: { qrToken },
            include: { course: true }
        });

        if (!session) {
            console.error(`[SCAN DEBUG] Token invalide ou inexistant: ${qrToken?.substring(0, 8)}...`);
            return res.status(404).json({
                message: "QR Code invalide ou expiré.",
                debugCode: "ERR_TOKEN_NOT_FOUND"
            });
        }

        console.log(`[SCAN DEBUG] Session trouvée pour cours ${session.courseCode}. Date session: ${session.date}`);

        if (session.isLocked) {
            return res.status(403).json({ message: "La prise de présence pour cette session est verrouillée." });
        }

        // 2. Vérifier la date (Mise à jour avec logs précis)
        const now = new Date();
        // On force le fuseau de Lubumbashi (UTC+2)
        const lubumbashiTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
        const todayStr = lubumbashiTime.toISOString().split('T')[0];

        // La date de la session peut être un objet Date, on la convertit en string YYYY-MM-DD
        const sessionDateObj = new Date(session.date);
        const sessionDateStr = sessionDateObj.toISOString().split('T')[0];

        console.log(`[SCAN DEBUG] Comparaisons dates - Aujourd'hui (L'shi): ${todayStr}, Session: ${sessionDateStr}`);

        if (todayStr !== sessionDateStr) {
            console.error(`[SCAN DEBUG] Échec date: ${todayStr} !== ${sessionDateStr}`);
            return res.status(403).json({
                message: "Ce QR Code ne correspond pas à la date d'aujourd'hui. Un nouveau code doit être généré.",
                debugDate: { today: todayStr, session: sessionDateStr }
            });
        }

        // 3. Vérifier si l'étudiant est inscrit au cours (AVANT les autres vérifications)
        const activeEnrollment = await prisma.studentCourseEnrollment.findFirst({
            where: {
                userId,
                courseCode: session.courseCode,
                isActive: true
            },
            include: {
                course: true
            }
        });

        if (!activeEnrollment) {
            console.error(`[SCAN DEBUG] Étudiant ${userId} non inscrit au cours ${session.courseCode}`);
            return res.status(403).json({
                message: `Accès refusé : Vous n'êtes pas enregistré dans la liste officielle du cours "${session.course?.name || session.courseCode}".`,
                debugCode: "ERR_STUDENT_NOT_ENROLLED",
                course: session.course?.name,
                year: "2025-2026" // Ou la session.academicYear si disponible
            });
        }

        // 4. Vérifier la distance par rapport aux points autorisés
        if (latitude && longitude) {
            const studentLat = parseFloat(latitude);
            const studentLng = parseFloat(longitude);

            // On vérifie si l'étudiant est proche d'AU MOINS UN des points de la faculté
            const isNearAnyPoint = FACULTY_LOCATIONS.some(loc => {
                const distance = calculateDistance(loc.lat, loc.lng, studentLat, studentLng);
                return distance <= 400; // Rayon de 400m
            });

            if (!isNearAnyPoint) {
                return res.status(403).json({
                    message: "Vous êtes trop loin de la Faculté pour valider votre présence. Assurez-vous d'être dans le bâtiment Géologie ou à proximité."
                });
            }
        } else {
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
