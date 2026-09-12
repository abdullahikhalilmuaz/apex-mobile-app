import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const onAuthScreen =
      segments[0] === undefined || segments[0] === "register";

    // No user → force to login (unless already on login/register)
    if (!user && !onAuthScreen) {
      router.replace("/");
      return;
    }

    // Logged-in user → force to dashboard (only if on auth screen)
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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0f0c29" },
      }}
    />
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
