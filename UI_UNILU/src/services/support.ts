const API_URL = 'http://localhost:3001/api';

export const supportService = {
    async createTicket(ticketData: { subject: string, category: string, priority: string, message: string }) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/support/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ticketData)
        });
        if (!response.ok) throw new Error('Erreur lors de la création du ticket');
        return response.json();
    },

    async getMyTickets() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/support/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur lors de la récupération des tickets');
        return response.json();
    },

    async getTicketDetails(ticketId: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur détails ticket');
        return response.json();
    },

    async addMessage(ticketId: string, content: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/support/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ticketId, content })
        });
        if (!response.ok) throw new Error('Erreur envoi message');
        return response.json();
    },

    async getNotifications() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/support/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur notifications');
        return response.json();
    },

    async markNotificationRead(id: string) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/support/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erreur marquage lecture');
        return response.json();
    }
};
