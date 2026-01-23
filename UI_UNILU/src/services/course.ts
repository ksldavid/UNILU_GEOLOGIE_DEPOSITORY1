import { API_URL } from './config';

export const courseService = {
    async getCourses(academicLevelId?: number) {
        const token = localStorage.getItem('token');
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
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/courses/levels`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des niveaux');
        return response.json();
    }
};
