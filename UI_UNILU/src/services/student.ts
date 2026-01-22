const API_URL = 'http://localhost:3001/api/student';

const getHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const studentService = {
    async getDashboard() {
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du dashboard');
        return response.json();
    },

    async getCourses() {
        const response = await fetch(`${API_URL}/courses`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des cours');
        return response.json();
    },

    async getCourseDetails(courseCode: string) {
        const response = await fetch(`${API_URL}/courses/${courseCode}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des détails du cours');
        return response.json();
    },

    async getSchedule() {
        const response = await fetch(`${API_URL}/schedule`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du planning');
        return response.json();
    },

    async getGrades() {
        const response = await fetch(`${API_URL}/grades`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des notes');
        return response.json();
    },

    async getAnnouncements() {
        const response = await fetch(`${API_URL}/announcements`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des annonces');
        return response.json();
    },

    async getCourseManagement() {
        const response = await fetch(`${API_URL}/courses-management`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération de la gestion des cours');
        return response.json();
    },

    async toggleCourseActive(courseCode: string, isActive: boolean) {
        const response = await fetch(`${API_URL}/courses/toggle-active`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ courseCode, isActive })
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour du cours');
        return response.json();
    },

    async submitAssignment(assessmentId: string, file: File) {
        const formData = new FormData();
        formData.append('assessmentId', assessmentId);
        formData.append('file', file);

        const response = await fetch(`${API_URL}/submit-assignment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                // Note: Don't set Content-Type for FormData
            },
            body: formData
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la soumission');
        }
        return response.json();
    },

    async markAnnouncementAsRead(announcementId: number) {
        const response = await fetch(`${API_URL}/announcements/${announcementId}/read`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors du marquage de l\'annonce comme lue');
        return response.json();
    }
};
