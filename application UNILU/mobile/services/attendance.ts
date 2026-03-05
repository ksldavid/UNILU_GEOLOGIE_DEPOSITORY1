
import { apiFetch } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const attendanceService = {
    scanQR: async (qrToken: string, latitude: number, longitude: number) => {
        return apiFetch('/attendance/scan', {
            method: 'POST',
            body: JSON.stringify({
                qrToken,
                latitude,
                longitude
            }),
        });
    },

    // Stockage hors-ligne pour le mobile
    saveOfflineScan: async (qrToken: string, latitude: number, longitude: number) => {
        const existing = await AsyncStorage.getItem('offline_scans');
        const scans = existing ? JSON.parse(existing) : [];

        scans.push({
            qrToken,
            latitude,
            longitude,
            timestamp: new Date().toISOString()
        });

        await AsyncStorage.setItem('offline_scans', JSON.stringify(scans));
    },

    syncOfflineScans: async () => {
        const existing = await AsyncStorage.getItem('offline_scans');
        if (!existing) return;

        const scans = JSON.parse(existing);
        if (scans.length === 0) return;

        const remaining = [];
        for (const scan of scans) {
            try {
                await attendanceService.scanQR(scan.qrToken, scan.latitude, scan.longitude);
            } catch (error) {
                remaining.push(scan);
            }
        }

        await AsyncStorage.setItem('offline_scans', JSON.stringify(remaining));
        return scans.length - remaining.length; // Nombre de scans réussis
    }
};
