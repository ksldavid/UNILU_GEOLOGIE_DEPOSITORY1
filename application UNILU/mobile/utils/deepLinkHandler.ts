/**
 * Deep Link Handler
 * Gère les liens profonds pour permettre aux étudiants de scanner
 * les QR codes avec l'appareil photo natif et ouvrir directement l'app
 */

export const extractTokenFromURL = (url: string): string | null => {
    console.log('📱 [DEEP LINK] Processing URL:', url);

    let token = null;

    // Format: https://domain.com/scan?t=TOKEN ou unilu://scan?t=TOKEN
    if (url.includes('t=')) {
        token = url.split('t=')[1].split('&')[0];
    } else if (url.includes('token=')) {
        token = url.split('token=')[1].split('&')[0];
    } else if (url.includes('/scan/')) {
        // Format alternatif: https://domain.com/scan/TOKEN
        const parts = url.split('/scan/');
        if (parts.length > 1) {
            token = parts[1].split('?')[0].split('/')[0];
        }
    }

    console.log('📱 [DEEP LINK] Extracted token:', token);
    return token;
};

export const isAttendanceQRLink = (url: string): boolean => {
    return url.includes('/scan') || url.includes('unilu://');
};
