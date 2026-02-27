import { API_URL } from './config';

export const getCourseProgress = async (academicLevelId?: number) => {
    const token = sessionStorage.getItem('token');
    const url = academicLevelId
        ? `${API_URL}/stats/course-progress?academicLevelId=${academicLevelId}`
        : `${API_URL}/stats/course-progress`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération de la progression des cours');
    return response.json();
};

export const getAcademicStats = async () => {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_URL}/stats/academic`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques');
    return response.json();
};
