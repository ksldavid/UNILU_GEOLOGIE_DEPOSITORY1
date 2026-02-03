
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: any;
}

/**
 * Sends a push notification to specific tokens
 */
export async function sendPushNotifications(tokens: string[], payload: PushNotificationPayload) {
    let messages: ExpoPushMessage[] = [];

    for (let pushToken of tokens) {
        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data,
            priority: 'high',
            channelId: 'announcements'
        });
    }

    // The Expo push notification service accepts batches of notifications
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Notification tickets:', ticketChunk);
            tickets.push(...ticketChunk);
            // NOTE: If a ticket contains an error code in ticket.details.error, you
            // must handle it appropriately. The error codes are listed in the Expo
            // documentation.
        } catch (error) {
            console.error('Error sending push notification chunk:', error);
        }
    }
}
