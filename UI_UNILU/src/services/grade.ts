import { API_URL } from './config';

export const gradeService = {
    async getGradeChangeRequests(status?: string) {
        const token = localStorage.getItem('token');
        const url = status
            ? `${API_URL}/grades/requests?status=${status.toUpperCase()}`
            : `${API_URL}/grades/requests`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des demandes');
        return response.json();
    },

    async updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/grades/requests/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, reason })
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour de la demande');
        return response.json();
    },

    async getPV(courseCode: string, academicYear: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/grades/pv?courseCode=${courseCode}&academicYear=${academicYear}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du PV');
        return response.json();
    },

    async getStats() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/grades/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques');
        return response.json();
    },

    async getMyRequests() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/grades/my-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération de votre historique');
        return response.json();
    }
};
