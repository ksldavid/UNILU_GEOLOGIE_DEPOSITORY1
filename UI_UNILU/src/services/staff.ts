
import { API_URL } from './config';

export const staffService = {
    async getAvailableStaff() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/staff/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du personnel');
        return response.json();
    },

    async getAssignments(academicYear?: string) {
        const token = localStorage.getItem('token');
        let url = `${API_URL}/staff/assignments`;
        if (academicYear) url += `?academicYear=${academicYear}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des affectations');
        return response.json();
    },

    async assignStaff(data: { userId: string, courseCode: string, role: string, academicYear: string }) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/staff/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de l'affectation");
        return response.json();
    },

    async removeStaff(data: { userId: string, courseCode: string, academicYear: string }) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/staff/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression");
        return response.json();
    }
};
