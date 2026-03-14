
import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import prisma from '../../lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

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
        const { courseCode, sessionNumber = 1, expiresInMinutes = 1440 } = req.body;
        const sessionNum = Number(sessionNumber);

        // Coordonnées par défaut
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

        // 3. Vérifier si une session existe déjà pour aujourd'hui avec ce numéro
        const existingSession = await (prisma as any).attendanceSession.findUnique({
            where: {
                courseCode_date_sessionNumber: {
                    courseCode,
                    date: today,
                    sessionNumber: sessionNum
                }
            }
        });

        // Calcul de l'expiration
        const qrExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        // FIX: Si une session existe déjà, on renvoie TOUJOURS le token existant s'il y en a un.
        // Cela évite d'invalider les scans des étudiants si le prof rafraîchit sa page.
        if (existingSession && existingSession.qrToken) {
            // On s'assure qu'elle est déverrouillée si le prof redemande le code
            if (existingSession.isLocked) {
                await (prisma as any).attendanceSession.update({
                    where: { id: existingSession.id },
                    data: {
                        isLocked: false,
                        qrExpiresAt: qrExpiresAt // On met à jour l'expiration si le prof la change
                    }
                });
            } else {
                // Même si pas locké, on met à jour le délai d'expiration si demandé
                await (prisma as any).attendanceSession.update({
                    where: { id: existingSession.id },
                    data: { qrExpiresAt: qrExpiresAt }
                });
            }

            return res.json({
                qrToken: existingSession.qrToken,
                sessionId: existingSession.id,
                expiresAt: qrExpiresAt
            });
        }

        // Sinon (première fois de la journée), on génère un nouveau token
        const qrToken = crypto.randomBytes(32).toString('hex');

        // On utilise upsert pour être sûr de ne pas créer de doublon en cas de clics simultanés
        const session = await (prisma as any).attendanceSession.upsert({
            where: {
                courseCode_date_sessionNumber: {
                    courseCode,
                    date: today,
                    sessionNumber: sessionNum
                }
            },
            update: {
                qrToken: existingSession?.qrToken || qrToken,
                qrExpiresAt,
                latitude,
                longitude,
                isLocked: false
            },
            create: {
                courseCode,
                date: today,
                sessionNumber: sessionNum,
                qrToken,
                qrExpiresAt,
                latitude,
                longitude,
                isLocked: false
            }
        });

        res.json({
            qrToken: session.qrToken,
            sessionId: session.id,
            expiresAt: qrExpiresAt
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

        // 1.5 Vérifier l'expiration du QR Code
        if (session.qrExpiresAt && new Date() > new Date(session.qrExpiresAt)) {
            return res.status(403).json({
                message: "Ce QR Code a expiré. Veuillez demander au professeur d'en générer un nouveau.",
                debugCode: "ERR_TOKEN_EXPIRED"
            });
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
                return distance <= 1000; // Rayon de 1000m (augmenté pour pallier l'imprécision du GPS en intérieur)
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

/**
 * [ADMIN/ACADEMIC_OFFICE] Récupère toutes les sessions d'un cours
 * avec le statut de présence de chaque étudiant inscrit.
 */
export const getCourseAttendanceSessions = async (req: AuthRequest, res: Response) => {
    try {
        const { courseCode } = req.params;

        const sessions = await (prisma as any).attendanceSession.findMany({
            where: { courseCode },
            orderBy: { date: 'desc' },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, name: true } }
                    }
                }
            }
        });

        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: { courseCode: courseCode as string, isActive: true },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        const formattedSessions = sessions.map((session: any) => {
            const studentsStatus = enrollments.map((enrollment: any) => {
                const record = session.records.find((r: any) => r.studentId === enrollment.userId);
                return {
                    studentId: enrollment.userId,
                    studentName: enrollment.user.name,
                    status: record ? record.status : 'ABSENT',
                    recordId: record ? record.id : null
                };
            });
            const presentCount = studentsStatus.filter((s: any) => s.status !== 'ABSENT').length;
            return {
                sessionId: session.id,
                date: session.date,
                sessionNumber: session.sessionNumber,
                courseCode: session.courseCode,
                isLocked: session.isLocked,
                totalStudents: enrollments.length,
                presentCount,
                absentCount: enrollments.length - presentCount,
                students: studentsStatus
            };
        });

        res.json(formattedSessions);
    } catch (error) {
        console.error('Erreur getCourseAttendanceSessions:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * [ADMIN/ACADEMIC_OFFICE] Rectifie manuellement la présence d'un étudiant.
 */
export const overrideAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const adminRole = req.user?.role;
        const { sessionId, studentId, newStatus } = req.body;

        if (!adminId) return res.status(401).json({ message: 'Non authentifié' });
        if (!['ADMIN', 'ACADEMIC_OFFICE'].includes(adminRole || '')) {
            return res.status(403).json({ message: 'Accès refusé : droits insuffisants' });
        }
        if (!sessionId || !studentId || !newStatus) {
            return res.status(400).json({ message: 'sessionId, studentId et newStatus sont requis' });
        }
        if (!['PRESENT', 'ABSENT', 'LATE'].includes(newStatus)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const session = await (prisma as any).attendanceSession.findUnique({
            where: { id: sessionId }
        });
        if (!session) return res.status(404).json({ message: 'Session introuvable' });

        const enrollment = await prisma.studentCourseEnrollment.findFirst({
            where: { userId: studentId, courseCode: session.courseCode }
        });
        if (!enrollment) {
            return res.status(404).json({ message: "Cet étudiant n'est pas inscrit à ce cours" });
        }

        const record = await (prisma as any).attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId, studentId } },
            update: { status: newStatus },
            create: { sessionId, studentId, status: newStatus }
        });

        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { name: true }
        });

        console.log(`[OVERRIDE] ${adminRole} ${adminId} -> ${student?.name} session ${sessionId} = ${newStatus}`);

        res.json({
            message: `Présence de ${student?.name} mise à jour : ${newStatus}`,
            record
        });
    } catch (error) {
        console.error('Erreur overrideAttendance:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Supprime une session de présence et tous ses enregistrements.
 * Nécessite une confirmation par mot de passe.
 */
export const deleteAttendanceSession = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { sessionId } = req.params;
        const { password } = req.body; // Mot de passe envoyé dans le body de la requête DELETE

        if (!userId) return res.status(401).json({ message: 'Non authentifié' });
        if (!sessionId) return res.status(400).json({ message: 'ID de session requis' });
        if (!password) return res.status(400).json({ message: 'Mot de passe de confirmation requis' });

        const sessionNumId = Number(sessionId);

        // 1. Récupérer l'utilisateur pour vérifier son mot de passe
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

        // 2. Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        // 3. Récupérer la session pour vérifier les droits
        const session = await (prisma as any).attendanceSession.findUnique({
            where: { id: sessionNumId }
        });

        if (!session) return res.status(404).json({ message: 'Session introuvable' });

        // 4. Vérifier si l'utilisateur est autorisé
        const isSuperUser = ['ADMIN', 'ACADEMIC_OFFICE'].includes(userRole || '');
        const isProfessorOfCourse = await prisma.courseEnrollment.findFirst({
            where: { userId, courseCode: session.courseCode }
        });

        if (!isSuperUser && !isProfessorOfCourse) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette session." });
        }

        // 5. Supprimer la session et ses enregistrements (Prisma gère la suppression si configuré, ou on le fait manuellement)
        // Pour être sûr, on utilise une transaction
        await prisma.$transaction([
            prisma.attendanceRecord.deleteMany({
                where: { sessionId: sessionNumId }
            }),
            (prisma as any).attendanceSession.delete({
                where: { id: sessionNumId }
            })
        ]);

        console.log(`[DELETE SESSION] Utilisateur ${userId} (${userRole}) a supprimé la session ${sessionNumId} de ${session.courseCode}`);

        res.json({ message: "La session et toutes les présences associées ont été supprimées avec succès." });

    } catch (error) {
        console.error('Erreur deleteAttendanceSession:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
    }
};

/**
 * [ADMIN] Génère un nouveau token offline hebdomadaire (chaque lundi à minuit via cron ou manuellement).
 */
export const rotateOfflineToken = async (req: AuthRequest, res: Response) => {
    try {
        const userRole = req.user?.role;
        if (!['ADMIN', 'ACADEMIC_OFFICE'].includes(userRole || '')) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        const token = crypto.randomBytes(32).toString('hex');

        // Expiration : prochain lundi à minuit (heure de Lubumbashi UTC+2)
        const now = new Date();
        const lubumbashi = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const daysUntilNextMonday = (8 - lubumbashi.getDay()) % 7 || 7;
        const nextMonday = new Date(lubumbashi);
        nextMonday.setDate(lubumbashi.getDate() + daysUntilNextMonday);
        nextMonday.setHours(0, 0, 0, 0);
        const expiresAt = new Date(nextMonday.getTime() - 2 * 60 * 60 * 1000); // Reconvertir en UTC

        // Désactiver l'ancien token
        await (prisma as any).offlineToken.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

        // Créer le nouveau
        const newToken = await (prisma as any).offlineToken.create({
            data: { token, expiresAt, isActive: true }
        });

        console.log(`[OFFLINE TOKEN] Nouveau token généré, expire le ${expiresAt.toISOString()}`);

        res.json({
            message: 'Token offline généré avec succès',
            expiresAt: newToken.expiresAt
        });
    } catch (error) {
        console.error('Erreur rotateOfflineToken:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * [STUDENT] Récupère le token offline actif à stocker localement dans l'app.
 * Appelé à chaque connexion de l'étudiant.
 */
export const getOfflineToken = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Non authentifié' });

        const activeToken = await (prisma as any).offlineToken.findFirst({
            where: { isActive: true, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        });

        if (!activeToken) {
            return res.status(404).json({ message: "Aucun token offline disponible. Contactez l'administration." });
        }

        res.json({
            token: activeToken.token,
            expiresAt: activeToken.expiresAt
        });
    } catch (error) {
        console.error('Erreur getOfflineToken:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * [STUDENT] Valide une présence enregistrée hors-ligne.
 * Vérifie : token offline valide + même jour + session QR existante + inscription + géoloc + pas de doublon
 */
export const scanQRTokenOffline = async (req: AuthRequest, res: Response) => {
    try {
        const { qrToken, latitude, longitude, offlineToken, scanTimestamp } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Non authentifié' });
        if (!offlineToken || !scanTimestamp) {
            return res.status(400).json({ message: 'Token offline et horodatage du scan requis' });
        }

        // === VÉRIFICATION 1 : Token offline valide et non expiré ===
        const validToken = await (prisma as any).offlineToken.findFirst({
            where: { token: offlineToken, isActive: true, expiresAt: { gt: new Date() } }
        });

        if (!validToken) {
            return res.status(403).json({
                message: 'Clé de sécurité offline invalide ou expirée. Reconnectez-vous pour obtenir une nouvelle clé.',
                debugCode: 'ERR_OFFLINE_TOKEN_INVALID'
            });
        }

        // === VÉRIFICATION 2 : Le scan doit être du JOUR MÊME (anti-manipulation horloge) ===
        const now = new Date();
        const lubumbashiNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const todayStr = lubumbashiNow.toISOString().split('T')[0];

        const scanDate = new Date(scanTimestamp);
        const lubumbashiScan = new Date(scanDate.getTime() + 2 * 60 * 60 * 1000);
        const scanDayStr = lubumbashiScan.toISOString().split('T')[0];

        if (scanDayStr !== todayStr) {
            return res.status(403).json({
                message: `Présence refusée : le scan date du ${scanDayStr} mais nous sommes le ${todayStr}. La présence n'est valable que le jour même.`,
                debugCode: 'ERR_WRONG_DAY',
                scanDay: scanDayStr,
                today: todayStr
            });
        }

        // === VÉRIFICATION 3 : Session QR existante ===
        const session = await (prisma as any).attendanceSession.findUnique({
            where: { qrToken },
            include: { course: true }
        });

        if (!session) {
            return res.status(404).json({ message: 'QR Code invalide.', debugCode: 'ERR_TOKEN_NOT_FOUND' });
        }

        // La session doit aussi être de ce jour
        const sessionDateObj = new Date(session.date);
        const lubumbashiSession = new Date(sessionDateObj.getTime() + 2 * 60 * 60 * 1000);
        const sessionDayStr = lubumbashiSession.toISOString().split('T')[0];

        if (sessionDayStr !== todayStr) {
            return res.status(403).json({
                message: `Ce QR Code correspond au ${sessionDayStr}. La présence ne peut être enregistrée que le jour du cours.`,
                debugCode: 'ERR_SESSION_WRONG_DAY'
            });
        }

        // === VÉRIFICATION 4 : Étudiant inscrit au cours ===
        const activeEnrollment = await prisma.studentCourseEnrollment.findFirst({
            where: { userId, courseCode: session.courseCode, isActive: true }
        });

        if (!activeEnrollment) {
            return res.status(403).json({
                message: `Accès refusé : Vous n'êtes pas inscrit au cours "${session.course?.name || session.courseCode}".`,
                debugCode: 'ERR_STUDENT_NOT_ENROLLED'
            });
        }

        // === VÉRIFICATION 5 : Géolocalisation au moment du scan ===
        if (latitude && longitude) {
            const studentLat = parseFloat(latitude);
            const studentLng = parseFloat(longitude);
            const isNearFaculty = FACULTY_LOCATIONS.some(loc =>
                calculateDistance(loc.lat, loc.lng, studentLat, studentLng) <= 1000
            );
            if (!isNearFaculty) {
                return res.status(403).json({
                    message: 'Vous étiez trop loin de la Faculté au moment du scan pour valider votre présence.'
                });
            }
        } else {
            return res.status(400).json({ message: 'La géolocalisation est requise.' });
        }

        // === VÉRIFICATION 6 : Pas de doublon ===
        const existingAttendance = await (prisma as any).attendanceRecord.findUnique({
            where: { sessionId_studentId: { sessionId: session.id, studentId: userId } }
        });

        if (existingAttendance && existingAttendance.status !== 'ABSENT') {
            return res.status(400).json({
                message: 'Vous avez déjà pris présence pour ce cours.',
                alreadyMarked: true,
                status: existingAttendance.status
            });
        }

        // === ENREGISTREMENT ===
        await (prisma as any).attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId: session.id, studentId: userId } },
            update: { status: 'PRESENT' },
            create: { sessionId: session.id, studentId: userId, status: 'PRESENT' }
        });

        console.log(`[OFFLINE SCAN] ✅ Étudiant: ${userId} | Cours: ${session.courseCode} | ScanTime: ${scanTimestamp}`);

        // Statistiques de feedback
        const allCourseSessions = await prisma.attendanceSession.findMany({
            where: { courseCode: session.courseCode },
            select: { id: true }
        });
        const sessionIds = allCourseSessions.map(s => s.id);
        const studentAttendances = await prisma.attendanceRecord.count({
            where: { studentId: userId, sessionId: { in: sessionIds }, status: { in: ['PRESENT', 'LATE'] } }
        });
        const totalSessions = allCourseSessions.length;
        const attendanceRate = totalSessions > 0 ? Math.round((studentAttendances / totalSessions) * 100) : 100;

        let feedbackMessage = `Présence offline validée ! Ton taux est de ${attendanceRate}%.`;
        if (attendanceRate > 90) feedbackMessage = `Incroyable ! ${attendanceRate}% de présence. Tu es un étudiant modèle ! 🏆`;
        else if (attendanceRate > 70) feedbackMessage = `Superbe ! Présence offline confirmée. ${attendanceRate}% — continue ainsi ! ✨`;
        else if (attendanceRate > 40) feedbackMessage = `Bravo ! Présence offline enregistrée. Taux : ${attendanceRate}% 🚀`;
        else feedbackMessage = `Présence offline validée ! Tu es à ${attendanceRate}%. Encore un effort ! 💪`;

        res.json({
            message: feedbackMessage,
            courseCode: session.courseCode,
            offlineSync: true,
            stats: { attendanceRate, totalPresent: studentAttendances, totalSessions }
        });

    } catch (error) {
        console.error('Erreur scanQRTokenOffline:', error);
        res.status(500).json({ message: 'Erreur lors de la validation de la présence offline' });
    }
};

