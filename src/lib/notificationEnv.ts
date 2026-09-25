import Constants from "expo-constants";
import { Platform } from "react-native";

export type NotifEnv = "web" | "expo-go" | "dev-client" | "standalone";

export function getNotifEnv(): NotifEnv {
  if (Platform.OS === "web") return "web";
  const ownership = Constants.appOwnership;
  if (ownership === "expo") return "expo-go";
  if (ownership === "standalone") return "standalone";
  return "dev-client";
}

// Native notifications only work in dev-client + standalone
export function canUseNativeNotifications(): boolean {
  const env = getNotifEnv();
  return env === "dev-client" || env === "standalone";
}

export const ENV_LABEL: Record<NotifEnv, string> = {
  web: "Web (notifications unsupported)",
  "expo-go": "Expo Go (notifications blocked since SDK 53)",
  "dev-client": "Development build",
  standalone: "Production app",
};
