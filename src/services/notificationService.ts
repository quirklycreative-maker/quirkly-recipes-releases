// src/services/notificationService.ts
import { Alert } from 'react-native';

export class NotificationService {
  async scheduleLocalReminder(title: string, body: string, secondsFromNow: number) {
    console.log(`[NotificationService] Scheduling local reminder "${title}": "${body}" in ${secondsFromNow} seconds`);
    
    // Simulate local notification firing after the duration using setTimeout
    setTimeout(() => {
      console.log(`[NotificationService] Notification FIRED: "${title}" - "${body}"`);
      Alert.alert(
        title,
        body,
        [{ text: "OK", onPress: () => console.log("Walk reminder acknowledged") }]
      );
    }, secondsFromNow * 1000);
  }

  async sendPushToOwner(payload: any) {
    console.log('[NotificationService] Simulating send push notification to owner:', payload);
    // In production, this would call a Firebase Function or Expo Push endpoint.
  }
}
