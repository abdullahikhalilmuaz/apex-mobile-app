import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import UpdateModal from "../components/UpdateModal";
import { useAppVersion } from "../hooks/useAppVersion";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { usePendingSync } from "../hooks/usePendingSync";

function PushSetup({ userId }: { userId?: string }) {
  usePushNotifications(userId);
  usePendingSync();
  return null;
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { result, shouldShow, dismiss } = useAppVersion();

  useEffect(() => {
    if (loading) return;

    const onAuthScreen =
      segments[0] === undefined || segments[0] === "register";

    if (!user && !onAuthScreen) {
      router.replace("/");
      return;
    }

    if (user && onAuthScreen) {
      const role = user.role;
      const target = `/${role}/dashboard`;
      router.replace(target as any);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f0c29",
        }}
      >
        <ActivityIndicator color="#667eea" size="large" />
      </View>
    );
  }

  const isForce = result?.status === "force";
  const info =
    result?.status === "soft" || result?.status === "force"
      ? result.info
      : null;

  return (
    <>
      <PushSetup userId={user?.id} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f0c29" },
        }}
      />
      <UpdateModal
        visible={shouldShow}
        force={isForce}
        info={info}
        onDismiss={dismiss}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
        <Toast />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
