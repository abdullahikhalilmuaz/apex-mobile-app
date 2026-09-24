import { useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import { Platform } from "react-native";
import api from "../lib/api";

// Detect if we're running in Expo Go (no native notifications)
const isExpoGo = Constants.appOwnership === "expo";

export function usePushNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Skip entirely in Expo Go — no native module available
    if (isExpoGo) {
      console.log("Push notifications skipped (running in Expo Go)");
      return;
    }

    if (!userId) return;

    let mounted = true;
    let Notifications: any;
    let Device: any;

    async function register() {
      try {
        // Lazy import — only loads when NOT in Expo Go
        Notifications = await import("expo-notifications");
        Device = await import("expo-device");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        if (!Device.isDevice) {
          setError("Must use a physical device for push notifications");
          return;
        }

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          setError("Permission not granted");
          return;
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#667eea",
          });
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          (Constants as any)?.easConfig?.projectId;

        if (!projectId) {
          setError("EAS projectId missing in app.json");
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        const token = tokenData.data;
        if (mounted) setExpoPushToken(token);

        await api.post("/notifications/register", {
          token,
          device: Platform.OS,
        });

        console.log("Push token registered:", token);
      } catch (e: any) {
        console.error("Push registration error:", e);
        setError(e?.message ?? "Push registration failed");
      }
    }

    register();

    // Foreground + tap listeners — also guarded
    (async () => {
      try {
        const N = await import("expo-notifications");
        notificationListener.current = N.addNotificationReceivedListener(
          (notification: any) => {
            console.log("Notification received (foreground):", notification);
          },
        );
        responseListener.current = N.addNotificationResponseReceivedListener(
          (response: any) => {
            console.log("Notification tapped:", response);
          },
        );
      } catch {}
    })();

    return () => {
      mounted = false;
      (async () => {
        try {
          const N = await import("expo-notifications");
          if (notificationListener.current)
            N.removeNotificationSubscription(notificationListener.current);
          if (responseListener.current)
            N.removeNotificationSubscription(responseListener.current);
        } catch {}
      })();
    };
  }, [userId]);

  return { expoPushToken, error };
}
