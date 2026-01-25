import API_URL from './config';
const STUDENT_API_URL = `${API_URL}/student`;

const getHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleResponse = async (response: Response, errorMessage: string) => {
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            import('./auth').then(({ authService }) => {
                authService.logout();
            });
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const studentService = {
    async getDashboard() {
        const response = await fetch(`${STUDENT_API_URL}/dashboard`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération du dashboard');
    },

    async getCourses() {
        const response = await fetch(`${STUDENT_API_URL}/courses`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération des cours');
    },

    async getCourseDetails(courseCode: string) {
        const response = await fetch(`${STUDENT_API_URL}/courses/${courseCode}`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération des détails du cours');
    },

    async getSchedule() {
        const response = await fetch(`${STUDENT_API_URL}/schedule`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération du planning');
    },

    async getGrades() {
        const response = await fetch(`${STUDENT_API_URL}/grades`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération des notes');
    },

    async getAnnouncements() {
        const response = await fetch(`${STUDENT_API_URL}/announcements`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération des annonces');
    },

    async getCourseManagement() {
        const response = await fetch(`${STUDENT_API_URL}/courses-management`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération de la gestion des cours');
    },

    async toggleCourseActive(courseCode: string, isActive: boolean) {
        const response = await fetch(`${STUDENT_API_URL}/courses/toggle-active`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ courseCode, isActive })
        });
        return handleResponse(response, 'Erreur lors de la mise à jour du cours');
    },

    async submitAssignment(assessmentId: string, file: File) {
        const formData = new FormData();
        formData.append('assessmentId', assessmentId);
        formData.append('file', file);

        const response = await fetch(`${STUDENT_API_URL}/submit-assignment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                // Note: Don't set Content-Type for FormData
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                import('./auth').then(({ authService }) => authService.logout());
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            let message = 'Erreur lors de la soumission';
            try {
                const error = await response.json();
                message = error.message || message;
            } catch (e) {
                if (response.status === 413) message = "Le fichier est trop volumineux (max 4.5MB sur Vercel)";
                else message = `Erreur serveur (${response.status})`;
            }
            throw new Error(message);
        }
        return response.json();
    },

    async markAnnouncementAsRead(announcementId: number) {
        const response = await fetch(`${STUDENT_API_URL}/announcements/${announcementId}/read`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors du marquage de l'annonce comme lue");
    }
};
