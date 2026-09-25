import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "notif_logs";
const MAX = 100;

export type NotifLog = {
  ts: number;
  type: "schedule" | "fire" | "cancel" | "error" | "permission";
  data: any;
};

export async function logEvent(type: NotifLog["type"], data: any) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const logs: NotifLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift({ ts: Date.now(), type, data });
    await AsyncStorage.setItem(KEY, JSON.stringify(logs.slice(0, MAX)));
  } catch {}
}

export async function getLogs(): Promise<NotifLog[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearLogs() {
  await AsyncStorage.removeItem(KEY);
}
