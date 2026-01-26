
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
        // On se base sur le fuseau horaire de Lubumbashi (UTC+2) pour la cohérence
        const now = new Date();
        const lubumbashiTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
        const todayStr = lubumbashiTime.toISOString().split('T')[0];
        const today = new Date(todayStr); // Sera stocké à 00:00:00 UTC par Prisma

        // 3. Générer ou mettre à jour la session d'aujourd'hui
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
            expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // Fin de journée
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

        // 3. Vérifier la distance (si les positions sont disponibles)
        if (session.latitude && session.longitude && latitude && longitude) {
            const distance = calculateDistance(
                session.latitude,
                session.longitude,
                parseFloat(latitude),
                parseFloat(longitude)
            );

            if (distance > 200) { // Limite de 200 mètres (Rayon de sécurité)
                return res.status(403).json({
                    message: `Vous êtes trop loin du lieu du cours pour valider votre présence (Distance actuelle: ${Math.round(distance)}m). Vous devez être à moins de 200m du professeur.`,
                    distance: Math.round(distance)
                });
            }
        } else if (!latitude || !longitude) {
            return res.status(400).json({ message: "La géolocalisation est requise pour valider la présence." });
        }

        // 4. Vérifier si l'étudiant est inscrit au cours
        const isEnrolled = await prisma.studentCourseEnrollment.findFirst({
            where: {
                userId,
                courseCode: session.courseCode,
                isActive: true
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({ message: "Vous n'êtes pas officiellement inscrit à ce cours." });
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
        // Si le statut était 'ABSENT' (mis par le prof ou le système), on le passe à 'PRESENT'
        await (prisma as any).attendanceRecord.upsert({
            where: {
                sessionId_studentId: {
                    sessionId: session.id,
                    studentId: userId
                }
            },
            update: {
                status: 'PRESENT'
            },
            create: {
                sessionId: session.id,
                studentId: userId,
                status: 'PRESENT'
            }
        });

        res.json({
            message: `Présence validée avec succès pour le cours : ${session.course.name}`,
            courseCode: session.courseCode
        });

    } catch (error) {
        console.error('Erreur scan QR:', error);
        res.status(500).json({ message: 'Erreur lors de la validation de la présence' });
    }
}
