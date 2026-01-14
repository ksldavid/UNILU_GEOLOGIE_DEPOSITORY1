const API_URL = 'http://localhost:3001/api';

export const scheduleService = {
    async getSchedule(academicLevelId: number, academicYear: string) {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/schedules?academicLevelId=${academicLevelId}&academicYear=${academicYear}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération du planning');
        return response.json();
    },

    async saveSchedule(academicLevelId: number, academicYear: string, schedules: any[]) {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                academicLevelId,
                academicYear,
                schedules: schedules.map(s => ({
                    code: s.code,
                    day: s.day,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    room: s.room
                }))
            })
        });
        if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du planning');
        return response.json();
    }
};
