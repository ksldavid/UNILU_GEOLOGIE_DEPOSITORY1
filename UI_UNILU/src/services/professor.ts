const API_URL = 'http://localhost:3001/api/professor';

const getHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const professorService = {
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

    async getStudents() {
        const response = await fetch(`${API_URL}/students`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des étudiants');
        return response.json();
    },

    async getSchedule() {
        const response = await fetch(`${API_URL}/schedule`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du planning');
        return response.json();
    },

    async saveAttendance(data: { courseCode: string, date: string, records: { studentId: string, status: string }[] }) {
        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de l'enregistrement des présences");
        return response.json();
    },

    async getStudentPerformance(studentId: string, courseCode: string) {
        const response = await fetch(`${API_URL}/students/${studentId}/performance?courseCode=${courseCode}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération des performances de l'étudiant");
        return response.json();
    },

    async createAnnouncement(data: any) {
        const response = await fetch(`http://localhost:3001/api/announcements`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la création de l'annonce");
        return response.json();
    },

    async getMyAnnouncements() {
        const response = await fetch(`http://localhost:3001/api/announcements/my`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération de mes annonces");
        return response.json();
    },

    async updateAnnouncement(id: number, data: any) {
        const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la mise à jour de l'annonce");
        return response.json();
    },

    async deleteAnnouncement(id: number) {
        const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de l'annonce");
        return response.json();
    },

    async getAttendanceHistory(courseCode?: string) {
        const url = courseCode
            ? `${API_URL}/attendance/history?courseCode=${courseCode}`
            : `${API_URL}/attendance/history`;
        const response = await fetch(url, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération de l'historique");
        return response.json();
    },
    async unenrollStudent(studentId: string, courseCode: string) {
        const response = await fetch(`${API_URL}/unenroll-student`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId, courseCode })
        });
        if (!response.ok) throw new Error("Erreur lors de la désinscription de l'étudiant");
        return response.json();
    },
    async searchStudents(query: string) {
        const response = await fetch(`${API_URL}/search-students?query=${query}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la recherche d'étudiants");
        return response.json();
    },
    async enrollStudent(studentId: string, courseCode: string) {
        const response = await fetch(`${API_URL}/enroll-student`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ studentId, courseCode })
        });
        if (!response.ok) throw new Error("Erreur lors de l'inscription de l'étudiant");
        return response.json();
    },
    async createAssessment(data: any) {
        const response = await fetch(`http://localhost:3001/api/professor/assessments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Erreur lors de la création de l'évaluation");
        return response.json();
    },
    async getCourseAssessments(courseCode: string) {
        const response = await fetch(`http://localhost:3001/api/professor/courses/${courseCode}/assessments`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération des évaluations");
        return response.json();
    },
    async saveGrades(assessmentId: number, grades: any[]) {
        const response = await fetch(`http://localhost:3001/api/professor/save-grades`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ assessmentId, grades })
        });
        if (!response.ok) throw new Error("Erreur lors de l'enregistrement des notes");
        return response.json();
    },

    async uploadResource(courseCode: string, title: string, file: File) {
        const formData = new FormData();
        formData.append('courseCode', courseCode);
        formData.append('title', title);
        formData.append('file', file);

        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/upload-resource`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) throw new Error("Erreur lors de l'envoi du document");
        return response.json();
    },

    async getCourseResources(courseCode: string) {
        const response = await fetch(`${API_URL}/courses/${courseCode}/resources`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération des documents");
        return response.json();
    },
    async deleteResource(resourceId: number) {
        const response = await fetch(`${API_URL}/resources/${resourceId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression du document");
        return response.json();
    }
};
