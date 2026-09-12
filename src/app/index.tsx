import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { colors, gradients, spacing, radius } from "../constants/colors";
import Toast from "react-native-toast-message";
import { GraduationCap, Mail, Lock } from "lucide-react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Please enter email and password",
      });
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      Toast.show({
        type: "success",
        text1: "Login successful",
        text2: "Welcome back!",
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.error || "Login failed. Please try again.";
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <GraduationCap size={40} color={colors.white} />
            </View>
            <Text style={styles.title}>Apex Global Academy</Text>
            <Text style={styles.subtitle}>Connect. Monitor. Achieve.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Mail size={20} color={colors.textDim} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textDim}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock size={20} color={colors.textDim} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.buttonWrap}
            >
              <LinearGradient
                colors={gradients.main}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/register")}
              style={styles.linkWrap}
            >
              <Text style={styles.linkText}>
                Don't have an account?{" "}
                <Text style={styles.linkAccent}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Better Education · Brighter Future</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  form: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: colors.white,
    fontSize: 15,
  },
  buttonWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  linkWrap: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  linkAccent: {
    color: colors.accent,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: colors.textFaint,
    fontSize: 12,
    marginTop: spacing.xxl,
  },
});
