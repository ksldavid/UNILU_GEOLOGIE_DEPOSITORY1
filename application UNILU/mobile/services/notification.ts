import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

export const notificationService = {
    registerForPushNotifications: async () => {
        if (!Device.isDevice) {
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('announcements_v2', {
                name: 'Alertes UNILU',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 200, 500],
                lightColor: '#0d9488',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                sound: 'default',
                enableVibrate: true,
                showBadge: true,
            });
        }

        // Check various sources for Project ID
        let projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        // Fallback hardcodé si la config dynamique échoue (souvent le cas en build autonome)
        if (!projectId) {
            projectId = "5a403b6c-f798-45da-9668-0b4361c47cf4";
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            return tokenData.data;
        } catch (e: any) {
            console.error("Erreur récupération token Expo:", e);
            // Optionnel: Décommenter pour debugger sur le téléphone
            // alert(`Erreur Push: ${e.message}`);
            return null;
        }
    },

    saveTokenToServer: async (token: string) => {
        try {
            await api.post('/users/push-token', { pushToken: token });
        } catch (e) {
            console.error('Erreur enregistrement Push Token:', e);
        }
    },

    init: async () => {
        try {
            const token = await notificationService.registerForPushNotifications();
            if (token) {
                await notificationService.saveTokenToServer(token);
            }
        } catch (e) {
            console.error(e);
        }
    }
};
