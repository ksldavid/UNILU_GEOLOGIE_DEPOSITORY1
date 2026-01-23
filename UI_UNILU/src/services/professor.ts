import API_URL from './config';
const PROFESSOR_API_URL = `${API_URL}/professor`;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const professorService = {
    async getDashboard() {
        const response = await fetch(`${PROFESSOR_API_URL}/dashboard`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du dashboard');
        return response.json();
    },

    async getCourses() {
        const response = await fetch(`${PROFESSOR_API_URL}/courses`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des cours');
        return response.json();
    },

    async getStudents(courseCode?: string) {
        const url = courseCode ? `${PROFESSOR_API_URL}/students?courseCode=${courseCode}` : `${PROFESSOR_API_URL}/students`;
        const response = await fetch(url, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des étudiants');
        return response.json();
    },

    async getSchedule() {
        const response = await fetch(`${PROFESSOR_API_URL}/schedule`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du planning');
        return response.json();
    },

    async saveAttendance(data: { courseCode: string, date: string, records: { studentId: string, status: string }[] }) {
        const response = await fetch(`${PROFESSOR_API_URL}/attendance`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de l'enregistrement des présences");
        return response.json();
    },

    async getStudentPerformance(studentId: string, courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/students/${studentId}/performance?courseCode=${courseCode}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération des performances de l'étudiant");
        return response.json();
    },

    async createAnnouncement(data: any) {
        const response = await fetch(`${API_URL}/announcements`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la création de l'annonce");
        return response.json();
    },

    async getMyAnnouncements() {
        const response = await fetch(`${API_URL}/announcements/my`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération de mes annonces");
        return response.json();
    },

    async updateAnnouncement(id: number, data: any) {
        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la mise à jour de l'annonce");
        return response.json();
    },

    async deleteAnnouncement(id: number) {
        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de l'annonce");
        return response.json();
    },

    async getAttendanceHistory(courseCode?: string) {
        const url = courseCode
            ? `${PROFESSOR_API_URL}/attendance/history?courseCode=${courseCode}`
            : `${PROFESSOR_API_URL}/attendance/history`;
        const response = await fetch(url, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération de l'historique");
        return response.json();
    },
    async unenrollStudent(studentId: string, courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/unenroll-student`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId, courseCode })
        });
        if (!response.ok) throw new Error("Erreur lors de la désinscription de l'étudiant");
        return response.json();
    },
    async searchStudents(query: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/search-students?query=${query}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la recherche d'étudiants");
        return response.json();
    },
    async enrollStudent(studentId: string, courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/enroll-student`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId, courseCode })
        });
        if (!response.ok) throw new Error("Erreur lors de l'inscription de l'étudiant");
        return response.json();
    },
    async createAssessment(data: any) {
        const response = await fetch(`${PROFESSOR_API_URL}/assessments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la création de l'évaluation");
        return response.json();
    },
    async getCourseAssessments(courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/${courseCode}/assessments`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération des évaluations");
        return response.json();
    },
    async saveGrades(assessmentId: number, grades: any[]) {
        const response = await fetch(`${PROFESSOR_API_URL}/save-grades`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ assessmentId, grades })
        });
        if (!response.ok) throw new Error("Erreur lors de l'enregistrement des notes");
        return response.json();
    },
    async deleteAssessment(assessmentId: number) {
        const response = await fetch(`${PROFESSOR_API_URL}/assessments/${assessmentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de l'épreuve");
        return response.json();
    },
    async publishAssessment(assessmentId: number) {
        const response = await fetch(`${PROFESSOR_API_URL}/assessments/${assessmentId}/publish`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la publication des notes");
        return response.json();
    },

    async uploadResource(courseCode: string, title: string, file: File) {
        const formData = new FormData();
        formData.append('courseCode', courseCode);
        formData.append('title', title);
        formData.append('file', file);

        const token = localStorage.getItem('token');
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
        if (!response.ok) throw new Error("Erreur lors de la récupération des documents");
        return response.json();
    },
    async deleteResource(resourceId: number) {
        const response = await fetch(`${PROFESSOR_API_URL}/resources/${resourceId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression du document");
        return response.json();
    },

    async requestGradeChange(data: { studentId: string, assessmentId: string, newScore: string, reason: string }, file?: File | null) {
        const formData = new FormData();
        formData.append('studentId', data.studentId);
        formData.append('assessmentId', data.assessmentId);
        formData.append('newScore', data.newScore);
        formData.append('reason', data.reason);
        if (file) formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${PROFESSOR_API_URL}/grade-change-request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) throw new Error("Erreur lors de l'envoi de la demande de modification");
        return response.json();
    },

    async getCoursePerformance(courseCode: string) {
        const response = await fetch(`${PROFESSOR_API_URL}/courses/${courseCode}/performance`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération des statistiques de performance");
        return response.json();
    }
};
