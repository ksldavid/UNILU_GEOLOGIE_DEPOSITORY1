import { API_URL } from './config';

export const courseService = {
    async getCourses(academicLevelId?: number) {
        const token = sessionStorage.getItem('token');
        const url = academicLevelId !== undefined
            ? `${API_URL}/courses?academicLevelId=${academicLevelId}`
            : `${API_URL}/courses`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des cours');
        return response.json();
    },

    async getLevels() {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/courses/levels`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des niveaux');
        return response.json();
    },

    async createCourse(data: { code: string; name: string; academicLevelIds: number[] }) {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la création du cours');
        }
        return response.json();
    },

    async updateCourse(code: string, data: { name: string }) {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/courses/${code}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la mise à jour du cours');
        }
        return response.json();
    }
};
