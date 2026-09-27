import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { canUseNativeNotifications, getNotifEnv } from "./notificationEnv";
import { logEvent } from "./notificationLogger";

const STORAGE_KEY = "class_alarms";
const CHANNEL_ID = "class-alarm-v2";
const SOUND_FILE = "alarm.wav";

export type ClassAlarm = {
  id: string;
  title: string;
  body?: string;
  hour: number;
  minute: number;
  days: number[]; // 0=Sun .. 6=Sat
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
  if (!canUseNativeNotifications()) return null;
  try {
    return await import("expo-notifications");
  } catch (e) {
    await logEvent("error", { where: "getNotifications", e: String(e) });
    return null;
  }
}

// ── Permission + Channel ──
export async function ensureNotificationPermission(): Promise<{
  granted: boolean;
  reason?: string;
}> {
  const env = getNotifEnv();
  if (env === "web") return { granted: false, reason: "web-not-supported" };
  if (env === "expo-go") return { granted: false, reason: "expo-go-blocked" };

  const Notifications = await getNotifications();
  if (!Notifications) return { granted: false, reason: "no-module" };

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Class Alarms",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#667eea",
        sound: SOUND_FILE,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    } catch (e) {
      await logEvent("error", {
        where: "setNotificationChannel",
        e: String(e),
      });
    }
  }

  await logEvent("permission", { status, env });
  return { granted: status === "granted", reason: status };
}

async function cancelAlarmNotifications(alarm: ClassAlarm) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  for (const id of alarm.notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      await logEvent("cancel", { id });
    } catch {}
  }
}

// ── Schedule ──
async function scheduleAlarmNotifications(
  alarm: ClassAlarm,
): Promise<string[]> {
  const perm = await ensureNotificationPermission();
  if (!perm.granted) {
    await logEvent("error", { where: "schedule", reason: perm.reason });
    return [];
  }

  const Notifications = await getNotifications();
  if (!Notifications) return [];

  const ids: string[] = [];

  for (const day of alarm.days) {
    if (day < 0 || day > 6) continue;

    try {
      // SDK 53+ requires typed trigger
      const trigger: any = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1, // Expo: 1=Sun..7=Sat
        hour: alarm.hour,
        minute: alarm.minute,
        channelId: CHANNEL_ID,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.title,
          body: alarm.body || "Class starting soon",
          sound: SOUND_FILE,
          data: { type: "class-alarm", alarmId: alarm.id },
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
        },
        trigger,
      });

      ids.push(id);
      await logEvent("schedule", { day, trigger, id });
    } catch (e: any) {
      await logEvent("error", {
        where: "scheduleOne",
        day,
        message: e?.message,
      });
    }
  }

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
  return alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const all = await getAlarms();
  const target = all.find((a) => a.id === id);
  if (target) await cancelAlarmNotifications(target);
  await saveAlarms(all.filter((a) => a.id !== id));
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

// ── Test (fires in 10 seconds) ──
export async function fireTestNotification(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const perm = await ensureNotificationPermission();
  if (!perm.granted) return { ok: false, reason: perm.reason };

  const Notifications = await getNotifications();
  if (!Notifications) return { ok: false, reason: "no-module" };

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Alarm",
        body: "If you hear beep beep beep, alarms work.",
        sound: SOUND_FILE,
        data: { type: "test" },
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        channelId: CHANNEL_ID,
      },
    });
    await logEvent("schedule", { kind: "test", seconds: 10 });
    return { ok: true };
  } catch (e: any) {
    await logEvent("error", { where: "fireTest", message: e?.message });
    return { ok: false, reason: e?.message };
  }
}

// ── Diagnostic: list all scheduled ──
export async function listScheduledNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

// ── Nuke everything ──
export async function cancelAllAlarms() {
  const Notifications = await getNotifications();
  if (Notifications) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  }
  await saveAlarms([]);
}
