import { API_URL as BASE_API_URL } from './config';

const API_URL = `${BASE_API_URL}/attendance`;

const getHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const attendanceService = {
    async generateQR(courseCode: string, sessionNumber: number = 1, expiresInMinutes: number = 1440, latitude?: number, longitude?: number) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        try {
            const response = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ courseCode, sessionNumber, expiresInMinutes, latitude, longitude }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la génération du QR Code');
            }
            return response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new Error('Délai d\'attente dépassé (vérifiez votre connexion)');
            throw error;
        }
    },

    async scanQR(qrToken: string, latitude: number, longitude: number) {
        const response = await fetch(`${API_URL}/scan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ qrToken, latitude, longitude })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors du scan du QR Code');
        }
        return response.json();
    },

    // --- ADMIN / SERVICE ACADÉMIQUE ---

    async getCourseSessions(courseCode: string) {
        const response = await fetch(`${API_URL}/sessions/${courseCode}`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la récupération des sessions');
        }
        return response.json();
    },

    async overrideAttendance(sessionId: number, studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') {
        const response = await fetch(`${API_URL}/override`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ sessionId, studentId, newStatus })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la rectification');
        }
        return response.json();
    },

    async deleteSession(sessionId: number, password: string) {
        const response = await fetch(`${API_URL}/session/${sessionId}`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ password })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la suppression de la session');
        }
        return response.json();
    }
};
