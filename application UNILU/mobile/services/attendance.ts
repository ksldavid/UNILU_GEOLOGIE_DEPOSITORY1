
import { apiFetch } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_TOKEN_KEY = 'offline_security_token';
const OFFLINE_SCANS_KEY = 'offline_scans';

// ============================================================
// TOKEN OFFLINE — Gestion du secret hebdomadaire
// ============================================================

/**
 * Télécharge et stocke le token offline depuis le serveur.
 * À appeler à chaque connexion de l'étudiant.
 */
export const refreshOfflineToken = async (): Promise<boolean> => {
    try {
        console.log('[OfflineToken] Tentative de rafraîchissement...');
        const result = await apiFetch('/attendance/offline-token');
        if (!result || !result.token) throw new Error('Format de réponse invalide');
        
        const now = new Date();
        await AsyncStorage.setItem(OFFLINE_TOKEN_KEY, JSON.stringify({
            token: result.token,
            expiresAt: result.expiresAt,
            fetchedAt: now.toISOString()
        }));
        console.log('[OfflineToken] Token mis à jour avec succès : expire le', result.expiresAt);
        return true;
    } catch (error: any) {
        console.warn('[OfflineToken] Échec du rafraîchissement:', error?.message || error);
        return false;
    }
};

/**
 * Récupère le token offline stocké localement.
 * Retourne null si absent ou expiré.
 */
export const getLocalOfflineToken = async (): Promise<{ token: string; expiresAt: string; fetchedAt: string } | null> => {
    try {
        const stored = await AsyncStorage.getItem(OFFLINE_TOKEN_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        // Vérifier si expiré localement (sécurité supplémentaire)
        if (new Date(parsed.expiresAt) < new Date()) return null;
        return parsed;
    } catch {
        return null;
    }
};

/**
 * Vérifie si le token offline est sur le point d'expirer (moins de 24h restantes)
 * ou s'il n'a pas été mis à jour depuis 7 jours.
 * Retourne le statut pour afficher la bannière d'urgence.
 */
export const getOfflineTokenStatus = async (): Promise<'ok' | 'warning' | 'expired'> => {
    try {
        const stored = await AsyncStorage.getItem(OFFLINE_TOKEN_KEY);
        if (!stored) return 'expired';

        let parsed;
        try {
            parsed = JSON.parse(stored);
        } catch {
            return 'expired';
        }

        if (!parsed.expiresAt) return 'expired';

        const expiresAt = new Date(parsed.expiresAt);
        const now = new Date();

        // 1. Vérifier si VRAIMENT expiré (la date de fin est passée)
        if (isNaN(expiresAt.getTime()) || expiresAt < now) {
            return 'expired';
        }

        // 2. Vérifier si on approche de la fin (moins de 24h)
        const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursRemaining < 24) {
            return 'warning';
        }

        // 3. Vérifier la date du dernier refresh (sécurité supplémentaire, 7 jours)
        if (parsed.fetchedAt) {
            const fetchedAt = new Date(parsed.fetchedAt);
            if (!isNaN(fetchedAt.getTime())) {
                const daysSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
                // On passe en warning si pas de refresh depuis 5 jours, expired seulement si 10 jours
                if (daysSinceFetch >= 10) return 'expired';
                if (daysSinceFetch >= 5) return 'warning';
            }
        }

        return 'ok';
    } catch (error) {
        console.error('[OfflineToken] Erreur check status:', error);
        return 'expired';
    }
};

// ============================================================
// SCANS EN LIGNE
// ============================================================

export const attendanceService = {
    scanQR: async (qrToken: string, latitude: number, longitude: number) => {
        return apiFetch('/attendance/scan', {
            method: 'POST',
            body: JSON.stringify({ qrToken, latitude, longitude }),
        });
    },

    // ============================================================
    // SCANS HORS-LIGNE — Stockage local avec token secret
    // ============================================================

    /**
     * Sauvegarde un scan hors-ligne localement avec le token secret et l'horodatage.
     * L'horodatage est critique : il sera envoyé au serveur pour valider le jour du scan.
     */
    saveOfflineScan: async (qrToken: string, latitude: number, longitude: number): Promise<void> => {
        // Récupérer le token secret local
        const offlineTokenData = await getLocalOfflineToken();
        if (!offlineTokenData) {
            throw new Error('Clé de sécurité offline absente ou expirée. Impossible de sauvegarder hors-ligne.');
        }

        const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
        const scans = existing ? JSON.parse(existing) : [];

        scans.push({
            qrToken,
            latitude,
            longitude,
            offlineToken: offlineTokenData.token,
            scanTimestamp: new Date().toISOString(), // Horodatage précis du scan
        });

        await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(scans));
        console.log(`[OfflineScan] Scan sauvegardé localement. Total en attente: ${scans.length}`);
    },

    /**
     * Synchronise les scans hors-ligne avec le serveur quand internet est disponible.
     * Utilise la route dédiée /attendance/scan-offline qui valide le token + le jour du scan.
     */
    syncOfflineScans: async (): Promise<number> => {
        const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
        if (!existing) return 0;

        const scans = JSON.parse(existing);
        if (scans.length === 0) return 0;

        const remaining = [];
        let successCount = 0;

        for (const scan of scans) {
            try {
                await apiFetch('/attendance/scan-offline', {
                    method: 'POST',
                    body: JSON.stringify({
                        qrToken: scan.qrToken,
                        latitude: scan.latitude,
                        longitude: scan.longitude,
                        offlineToken: scan.offlineToken,
                        scanTimestamp: scan.scanTimestamp,
                    }),
                });
                successCount++;
                console.log(`[Sync] ✅ Présence offline synchronisée pour token ${scan.qrToken?.substring(0, 8)}...`);
            } catch (error: any) {
                // Erreur réseau → on réessaye plus tard
                const isNetworkError = error.status === 0 ||
                    error.message?.includes('network') ||
                    error.message?.includes('fetch') ||
                    error.message?.includes('connexion') ||
                    error.message?.includes('serveur');

                if (isNetworkError) {
                    remaining.push(scan);
                } else {
                    // Erreur logique (ex: mauvais jour, token invalide, déjà présent) → on abandonne
                    console.warn('[Sync] ❌ Scan ignoré (erreur logique):', error.message);
                }
            }
        }

        await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(remaining));
        return successCount;
    },

    /**
     * Retourne le nombre de scans en attente de synchronisation.
     */
    getPendingOfflineScansCount: async (): Promise<number> => {
        const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
        if (!existing) return 0;
        const scans = JSON.parse(existing);
        return scans.length;
    }
};
