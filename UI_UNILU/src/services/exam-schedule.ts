import { API_URL, getAuthHeaders } from './config';

export interface ExamScheduleData {
    id?: number;
    academicLevelId: number;
    courseCode: string;
    type: 'EXAM' | 'INTERROGATION';
    date: string;
    month: number;
    year: number;
    academicYear?: string;
    course?: {
        name: string;
        professor: string;
        colorFrom: string;
        colorTo: string;
    };
    creatorId?: string;
}

export const examScheduleService = {
    async create(data: ExamScheduleData): Promise<ExamScheduleData> {
        const response = await fetch(`${API_URL}/exam-schedules`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création du planning');
        }
        
        return response.json();
    },

    async getAll(params?: { academicLevelId?: number; month?: number; year?: number; courseCode?: string }): Promise<ExamScheduleData[]> {
        const queryParams = new URLSearchParams();
        if (params?.academicLevelId) queryParams.append('academicLevelId', params.academicLevelId.toString());
        if (params?.month) queryParams.append('month', params.month.toString());
        if (params?.year) queryParams.append('year', params.year.toString());
        if (params?.courseCode) queryParams.append('courseCode', params.courseCode);

        const url = `${API_URL}/exam-schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Erreur de récupération des plannings');
        return response.json();
    },

    async delete(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/exam-schedules/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
    }
};
