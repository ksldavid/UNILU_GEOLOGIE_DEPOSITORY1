import API_URL from './config';
const PROFESSOR_API_URL = `${API_URL}/professor`;

const getHeaders = () => {
    const token = sessionStorage.getItem('token');

    // Debug: Log si le token existe
    if (!token) {
        console.error('❌ [Professor Service] Aucun token trouvé dans sessionStorage');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Fonction helper pour gérer les erreurs de façon uniforme
const handleResponse = async (response: Response, errorMessage: string) => {
    if (!response.ok) {
        // Si erreur 401 ou 403, c'est probablement un problème d'authentification
        if (response.status === 401 || response.status === 403) {
            console.error(`❌ [Professor Service] Erreur d'authentification (${response.status})`);

            // Déconnexion automatique et redirection
            import('./auth').then(({ authService }) => {
                authService.logout();
            });

            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        let message = errorMessage;
        try {
            const error = await response.json();
            message = error.message || message;
        } catch (e) {
            message = `${errorMessage} (${response.status})`;
        }
        throw new Error(message);
    }
    return response.json();
};

export const professorService = {
    async getDashboard() {
        console.log('📊 [Professor Service] Appel GET /dashboard');
        const response = await fetch(`${PROFESSOR_API_URL}/dashboard`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération du dashboard');
    },

    async getCourses() {
        console.log('📚 [Professor Service] Appel GET /courses');
        const response = await fetch(`${PROFESSOR_API_URL}/courses`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération des cours');
    },

    async getStudents(courseCode?: string) {
        const url = courseCode ? `${PROFESSOR_API_URL}/students?courseCode=${courseCode}` : `${PROFESSOR_API_URL}/students`;
        console.log('👨‍🎓 [Professor Service] Appel GET /students', courseCode ? `(course: ${courseCode})` : '');
        const response = await fetch(url, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération des étudiants');
    },

    async getSchedule() {
        const response = await fetch(`${PROFESSOR_API_URL}/schedule`, {
            headers: getHeaders()
        });
        return handleResponse(response, 'Erreur lors de la récupération du planning');
    },

    async saveAttendance(data: { courseCode: string, date: string, records: { studentId: string, status: string }[] }) {
        const response = await fetch(`${PROFESSOR_API_URL}/attendance`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, "Erreur lors de l'enregistrement des présences");
    },

    async getStudentPerformance(studentId: string, courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/students/${studentId}/performance?courseCode=${courseCode}`, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la récupération des performances de l'étudiant");
    },

    async createAnnouncement(data: any) {
        const response = await fetch(`${API_URL}/announcements`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, "Erreur lors de la création de l'annonce");
    },

    async getMyAnnouncements() {
        const response = await fetch(`${API_URL}/announcements/my`, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la récupération de mes annonces");
    },

    async updateAnnouncement(id: number, data: any) {
        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, "Erreur lors de la mise à jour de l'annonce");
    },

    async deleteAnnouncement(id: number) {
        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la suppression de l'annonce");
    },

    async getAttendanceHistory(courseCode?: string) {
        const url = courseCode
            ? `${PROFESSOR_API_URL}/attendance/history?courseCode=${courseCode}`
            : `${PROFESSOR_API_URL}/attendance/history`;
        const response = await fetch(url, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la récupération de l'historique");
    },
    async unenrollStudent(studentId: string, courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/unenroll-student`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId, courseCode })
        });
        return handleResponse(response, "Erreur lors de la désinscription de l'étudiant");
    },
    async searchStudents(query: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/search-students?query=${query}`, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la recherche d'étudiants");
    },
    async enrollStudent(studentId: string, courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/enroll-student`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId, courseCode })
        });
        return handleResponse(response, "Erreur lors de l'inscription de l'étudiant");
    },
    async createAssessment(data: any) {
        const response = await fetch(`${PROFESSOR_API_URL}/assessments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, "Erreur lors de la création de l'évaluation");
    },
    async getCourseAssessments(courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/${courseCode}/assessments`, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la récupération des évaluations");
    },
    async saveGrades(assessmentId: number, grades: any[]) {
        const response = await fetch(`${PROFESSOR_API_URL}/save-grades`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ assessmentId, grades })
        });
        return handleResponse(response, "Erreur lors de l'enregistrement des notes");
    },
    async deleteAssessment(assessmentId: number) {
        const response = await fetch(`${PROFESSOR_API_URL}/assessments/${assessmentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la suppression de l'épreuve");
    },
    async publishAssessment(assessmentId: number) {
        const response = await fetch(`${PROFESSOR_API_URL}/assessments/${assessmentId}/publish`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la publication des notes");
    },

    async uploadResource(courseCode: string, title: string, file: File) {
        const formData = new FormData();
        formData.append('courseCode', courseCode);
        formData.append('title', title);
        formData.append('file', file);

        const token = sessionStorage.getItem('token');
        console.log('📤 [Professor Service] Upload resource, token:', token ? 'Présent' : 'Absent');

        const response = await fetch(`${PROFESSOR_API_URL}/upload-resource`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            let message = "Erreur lors de l'envoi du document";
            try {
                const error = await response.json();
                message = error.message || message;
            } catch (e) {
                if (response.status === 413) message = "Le fichier est trop volumineux (max 4.5MB sur Vercel)";
                else if (response.status === 401 || response.status === 403) message = "Session expirée. Veuillez vous reconnecter.";
                else message = `Erreur serveur (${response.status})`;
            }
            throw new Error(message);
        }
        return response.json();
    },

    async getCourseResources(courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/${courseCode}/resources`, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la récupération des documents");
    },
    async deleteResource(resourceId: number) {
        const response = await fetch(`${PROFESSOR_API_URL}/resources/${resourceId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la suppression du document");
    },

    async requestGradeChange(data: { studentId: string, assessmentId: string, newScore: string, reason: string }, file?: File | null) {
        const formData = new FormData();
        formData.append('studentId', data.studentId);
        formData.append('assessmentId', data.assessmentId);
        formData.append('newScore', data.newScore);
        formData.append('reason', data.reason);
        if (file) formData.append('file', file);

        const token = sessionStorage.getItem('token');
        const response = await fetch(`${PROFESSOR_API_URL}/grade-change-request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            throw new Error("Erreur lors de l'envoi de la demande de modification");
        }
        return response.json();
    },

    async getCoursePerformance(courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/${courseCode}/performance`, {
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la récupération des statistiques de performance");
    },

    async syncPastAttendance() {
        const response = await fetch(`${PROFESSOR_API_URL}/attendance/sync-past`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, "Erreur lors de la synchronisation des présences passées");
    },
    async updateCourseStatus(courseCode: string, status: 'ACTIVE' | 'FINISHED') {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/update-status`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ courseCode, status })
        });
        return handleResponse(response, "Erreur lors du changement de statut");
    },
    async removeCourseAssignment(courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/remove`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ courseCode })
        });
        return handleResponse(response, "Erreur lors du retrait du cours");
    }
};
