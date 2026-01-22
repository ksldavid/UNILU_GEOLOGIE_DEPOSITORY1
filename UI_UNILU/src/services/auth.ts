import { API_URL } from './config';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export const authService = {
    async login(emailOrId: string, password: string): Promise<AuthResponse> {
        // Petit délai artificiel pour l'UX (1.5s)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailOrId, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Échec de la connexion');
        }

        // Stocker le token
        if (data.token) {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        return data; // Contient { message, token, user }
    },

    logout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },

    getCurrentUser() {
        const userStr = sessionStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    }
};
