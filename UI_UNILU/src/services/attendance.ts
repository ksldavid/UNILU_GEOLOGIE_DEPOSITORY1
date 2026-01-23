
const API_URL = 'http://localhost:3001/api/attendance';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const attendanceService = {
    async generateQR(courseCode: string, latitude?: number, longitude?: number) {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ courseCode, latitude, longitude })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la génération du QR Code');
        }
        return response.json();
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
    }
};
