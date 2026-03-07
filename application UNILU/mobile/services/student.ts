
import { apiFetch } from './api';

export const studentService = {
    getProfile: async () => {
        return apiFetch('/student/profile'); // Vous devrez peut-être créer cette route si elle n'existe pas
    },

    getAttendanceStats: async () => {
        return apiFetch('/attendance/stats');
    },

    getSchedule: async () => {
        return apiFetch('/student/schedule');
    },

    getExams: async () => {
        return apiFetch('/student/exams');
    },

    getCourses: async () => {
        return apiFetch('/student/courses');
    },
    getDashboard: async () => {
        return apiFetch('/student/dashboard');
    },
    async updateProfile(data: { name?: string; email?: string; sex?: string; birthday?: string; nationality?: string; whatsapp?: string }): Promise<any> {
        return apiFetch('/student/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async updatePushToken(token: string) {
        return apiFetch('/users/push-token', {
            method: 'POST',
            body: JSON.stringify({ pushToken: token })
        });
    },
    async getAds() {
        return apiFetch('/ads/active');
    },
    async getAllAds() {
        return apiFetch('/ads'); // Admin route
    },
    async createAd(formData: any) {
        return apiFetch('/ads', {
            method: 'POST',
            body: formData
        });
    },
    async deleteAd(id: string) {
        return apiFetch(`/ads/${id}`, {
            method: 'DELETE'
        });
    },
    async triggerAdNotify(id: string) {
        return apiFetch(`/ads/${id}/notify`, {
            method: 'POST'
        });
    },
    async trackAdClick(id: string) {
        return apiFetch(`/ads/${id}/click`, {
            method: 'POST'
        });
    },
    async getAvailableCourses() {
        return apiFetch('/student/courses/available');
    },
    async enrollInCourse(courseCode: string) {
        return apiFetch('/student/courses/enroll', {
            method: 'POST',
            body: JSON.stringify({ courseCode })
        });
    },
    async unenrollFromCourse(courseCode: string, password: string) {
        return apiFetch('/student/courses/unenroll', {
            method: 'POST',
            body: JSON.stringify({ courseCode, password })
        });
    }
};
