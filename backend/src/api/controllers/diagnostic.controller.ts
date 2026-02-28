import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../../lib/prisma';

// Coordonnées GPS fixes du Campus UNILU Kasapa
const CAMPUS_LAT = -11.6163;
const CAMPUS_LNG = 27.4789;

// Formule de Haversine pour le calcul de distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Décoder le JWT pour obtenir l'expiration
function getExpiryFromToken(token: string): { expiresAt: Date | null; remainingSeconds: number } {
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (!payload.exp) return { expiresAt: null, remainingSeconds: -1 };
        const expiresAt = new Date(payload.exp * 1000);
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        return { expiresAt, remainingSeconds };
    } catch {
        return { expiresAt: null, remainingSeconds: -1 };
    }
}

// POST /api/diagnostic/location
export const submitLocationDiagnostic = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { latitude, longitude, accuracy, token } = req.body;

        if (!userId) return res.status(401).json({ message: 'Non autorisé' });
        
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Coordonnées GPS manquantes' });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const dist = calculateDistance(lat, lng, CAMPUS_LAT, CAMPUS_LNG);
        const onCampus = dist <= 0.5; // Rayon de 500m

        const tokenInfo = token ? getExpiryFromToken(token) : { expiresAt: null, remainingSeconds: -1 };
        const tokenExpired = tokenInfo.remainingSeconds === 0;

        // Récupérer les infos de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const studentName = user?.name || 'Inconnu';
        const distRounded = Math.round(dist * 1000) / 1000;

        // CRÉATION D'UN SUPPORT TICKET (Utilisation du schéma EXISTANT et STABLE)
        // C'est 100% sûr car on ne modifie pas la base de données
        await prisma.supportTicket.create({
            data: {
                subject: 'DIAGNOSTIC_GPS',
                category: 'SUPPORT_TECHNIQUE',
                priority: 'LOW',
                status: 'CLOSED', // On le ferme direct car c'est un log
                userId: userId,
                metadata: {
                    studentName,
                    receivedLat: lat,
                    receivedLng: lng,
                    accuracy: accuracy ? Number(accuracy) : null,
                    distanceKm: distRounded,
                    onCampus,
                    tokenRemainingSeconds: tokenInfo.remainingSeconds,
                    tokenExpired
                }
            }
        });

        res.json({
            success: true,
            message: 'Diagnostic enregistré via Support Ticket',
            data: {
                studentName,
                distanceKm: distRounded,
                onCampus,
                tokenExpired
            }
        });

    } catch (error: any) {
        console.error('Diagnostic error:', error);
        res.status(500).json({ message: 'Erreur diagnostic', error: error.message });
    }
};

// GET /api/diagnostic/locations (Admin only)
export const getLocationDiagnostics = async (req: Request, res: Response) => {
    try {
        // On récupère les tickets de type DIAGNOSTIC_GPS
        const tickets = await prisma.supportTicket.findMany({
            where: {
                subject: 'DIAGNOSTIC_GPS'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        // Formater pour le frontend
        const diagnostics = tickets.map(t => ({
            id: t.id,
            userId: t.userId,
            studentName: (t.metadata as any)?.studentName || 'Inconnu',
            studentCode: t.userId,
            receivedLat: (t.metadata as any)?.receivedLat,
            receivedLng: (t.metadata as any)?.receivedLng,
            accuracy: (t.metadata as any)?.accuracy,
            distanceKm: (t.metadata as any)?.distanceKm,
            onCampus: (t.metadata as any)?.onCampus,
            tokenRemainingSeconds: (t.metadata as any)?.tokenRemainingSeconds,
            tokenExpired: (t.metadata as any)?.tokenExpired,
            createdAt: t.createdAt
        }));

        res.json({ 
            campusCoords: { lat: CAMPUS_LAT, lng: CAMPUS_LNG },
            diagnostics 
        });
    } catch (error) {
        console.error('Get diagnostics error:', error);
        res.status(500).json({ message: 'Erreur récupération' });
    }
};

// DELETE /api/diagnostic/locations
export const clearDiagnostics = async (req: Request, res: Response) => {
    try {
        await prisma.supportTicket.deleteMany({
            where: { subject: 'DIAGNOSTIC_GPS' }
        });
        res.json({ message: 'Diagnostics nettoyés' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur nettoyage' });
    }
};
