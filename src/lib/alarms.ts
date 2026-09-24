import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";
const STORAGE_KEY = "class_alarms";

export type ClassAlarm = {
  id: string;
  title: string;
  body?: string;
  hour: number;
  minute: number;
  days: number[];
  className?: string;
  enabled: boolean;
  notificationIds: string[];
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getAlarms(): Promise<ClassAlarm[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveAlarms(alarms: ClassAlarm[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

async function getNotifications(): Promise<any> {
  if (isExpoGo) return null;
  return await import("expo-notifications");
}

async function cancelAlarmNotifications(alarm: ClassAlarm) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  for (const id of alarm.notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
}

async function scheduleAlarmNotifications(
  alarm: ClassAlarm,
): Promise<string[]> {
  const Notifications = await getNotifications();

  // ─── DEBUG: shows in Expo Go AND real APK ───
  console.log("=== ALARM DEBUG ===");
  console.log("Alarm:", {
    title: alarm.title,
    body: alarm.body,
    hour: alarm.hour,
    minute: alarm.minute,
    days: alarm.days,
  });

  if (!Notifications) {
    console.log("Would schedule for these triggers:");
    for (const day of alarm.days) {
      console.log(
        `→ weekday: ${day + 1} (${DAY_LABELS[day]}), hour: ${alarm.hour}, minute: ${alarm.minute}, repeats: true`,
      );
    }
    console.log("Alarm scheduling skipped (running in Expo Go)");
    return [];
  }

  const ids: string[] = [];

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("class-alarm", {
      name: "Class Alarms",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#667eea",
      sound: "default",
    });
  }

  for (const day of alarm.days) {
    const trigger = {
      weekday: day + 1,
      hour: alarm.hour,
      minute: alarm.minute,
      repeats: true,
      channelId: "class-alarm",
    } as any;

    console.log("Scheduling notification with trigger:", trigger);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.title,
        body: alarm.body || "Class starting soon",
        sound: "default",
        data: { type: "class-alarm", alarmId: alarm.id },
      },
      trigger,
    });
    ids.push(id);
  }

  console.log("Scheduled notification IDs:", ids);
  return ids;
}

export async function createAlarm(
  input: Omit<ClassAlarm, "id" | "notificationIds" | "enabled">,
): Promise<ClassAlarm> {
  const alarm: ClassAlarm = {
    ...input,
    id: Date.now().toString(),
    enabled: true,
    notificationIds: [],
  };

  alarm.notificationIds = await scheduleAlarmNotifications(alarm);

  const all = await getAlarms();
  all.push(alarm);
  await saveAlarms(all);

  console.log("=== ALARM SAVED ===", alarm);
  return alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const all = await getAlarms();
  const target = all.find((a) => a.id === id);
  if (target) {
    await cancelAlarmNotifications(target);
  }
  const filtered = all.filter((a) => a.id !== id);
  await saveAlarms(filtered);
}

export async function toggleAlarm(id: string): Promise<void> {
  const all = await getAlarms();
  const target = all.find((a) => a.id === id);
  if (!target) return;

  if (target.enabled) {
    await cancelAlarmNotifications(target);
    target.notificationIds = [];
    target.enabled = false;
  } else {
    target.notificationIds = await scheduleAlarmNotifications(target);
    target.enabled = true;
  }

  await saveAlarms(all);
}
