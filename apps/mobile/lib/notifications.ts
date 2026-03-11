/**
 * Local push notification utilities for medication reminders.
 * Uses expo-notifications to schedule time-based daily reminders on-device.
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { MedicationReminder } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medication-reminders", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function reminderNotificationId(reminderId: string, timeIndex: number): string {
  return `med-${reminderId}-${timeIndex}`;
}

export async function scheduleReminder(reminder: MedicationReminder): Promise<void> {
  if (!reminder.is_active) return;

  for (let i = 0; i < reminder.reminder_times.length; i++) {
    const time = reminder.reminder_times[i];
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: reminderNotificationId(reminder.id, i),
      content: {
        title: "Medication Reminder",
        body: reminder.dosage
          ? `Time to take ${reminder.medication_name} (${reminder.dosage})`
          : `Time to take ${reminder.medication_name}`,
        data: { reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function cancelReminder(reminderId: string, timeCount: number = 3): Promise<void> {
  for (let i = 0; i < timeCount; i++) {
    await Notifications.cancelScheduledNotificationAsync(
      reminderNotificationId(reminderId, i)
    );
  }
}

export async function syncReminders(reminders: MedicationReminder[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of reminders) {
    if (r.is_active) {
      await scheduleReminder(r);
    }
  }
}
