
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';

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

        return data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('userSession');
    }
};
