
const API_URL = 'http://localhost:3001/api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string; // 'STUDENT' | 'USER' | 'ADMIN' | 'ACADEMIC_OFFICE'
    systemRole: string;
    status: 'active' | 'blocked';
    avatarColor?: string; // On pourra le générer côté front
    // Student specific
    studentCourseEnrollments?: any[];
    // Staff specific
    academicProfile?: any;
}

export const userService = {
    async getAllUsers(role?: string, academicLevelId?: number) {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        let url = `${API_URL}/users`;
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (academicLevelId !== undefined) params.append('academicLevelId', academicLevelId.toString());

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des utilisateurs');
        }
        return response.json();
    },

    async updateUser(id: string, data: { name?: string, email?: string, title?: string }) {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
        }
        return response.json();
    },

    async getAcademicStats() {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/stats/academic`, { headers });
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }
        return response.json();
    },

    async getRecentActivities() {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/stats/recent-activities`, { headers });
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des activités');
        }
        return response.json();
    },

    async getAttendanceStats() {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/stats/attendance-stats`, { headers });
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des stats de présence');
        }
        return response.json();
    },

    async getDetailedAttendance(courseCode: string, academicLevelId: number) {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/stats/course-attendance?courseCode=${courseCode}&academicLevelId=${academicLevelId}`, { headers });
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de l\'assiduité détaillée');
        }
        return response.json();
    },

    async createAnnouncement(data: { title: string, content: string, type: string, target: string, academicLevelId?: number, targetUserId?: string }) {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}/announcements`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la création de l\'annonce');
        }
        return response.json();
    }
};
