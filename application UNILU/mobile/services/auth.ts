
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';
import { refreshOfflineToken } from './attendance';

export const authService = {
    login: async (idNumber: string, password: string) => {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ idNumber, password, platform: 'mobile' }),
        });

        // Save full session including JWT token
        await AsyncStorage.setItem('userSession', JSON.stringify({
            id: data.user.id,
            name: data.user.name,
            token: data.token,
            role: data.user.systemRole,
            timestamp: new Date().getTime()
        }));

        // Rafraîchir le token offline en arrière-plan (silencieux si pas d'internet)
        refreshOfflineToken().catch(() => {});

        return data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('userSession');
    }
};
