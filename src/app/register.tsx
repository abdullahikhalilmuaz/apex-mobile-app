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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { colors, gradients, spacing, radius } from "../constants/colors";
import Toast from "react-native-toast-message";
import { Mail, Lock, User, Phone, School, Users } from "lucide-react-native";
import api from "../lib/api";

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "headmaster" as "headmaster" | "teacher" | "parent",
    schoolName: "",
    classAssigned: "",
    subjects: "",
    relationship: "",
    childrenAdmission: "",
  });

  const handleRegister = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Fill all required fields",
      });
      return;
    }

    const data: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
    };

    if (formData.role === "headmaster") {
      if (!formData.schoolName.trim()) {
        Toast.show({ type: "error", text1: "School name required" });
        return;
      }
      data.schoolName = formData.schoolName.trim();
    }

    if (formData.role === "teacher") {
      if (!formData.classAssigned || !formData.subjects.trim()) {
        Toast.show({ type: "error", text1: "Class and subjects required" });
        return;
      }
      data.classAssigned = formData.classAssigned;
      data.subjects = formData.subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (formData.role === "parent") {
      if (!formData.relationship) {
        Toast.show({ type: "error", text1: "Relationship required" });
        return;
      }
      data.relationship = formData.relationship;
      data.childrenAdmission = formData.childrenAdmission
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    setLoading(true);
    try {
      const endpoint =
        formData.role === "headmaster"
          ? "/headmaster/register"
          : formData.role === "teacher"
            ? "/teacher/register"
            : "/parent/register";

      await api.post(endpoint, data);
      Toast.show({
        type: "success",
        text1: "Account created!",
        text2: "You can now login",
      });
      router.replace("/");
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Registration failed";
      Toast.show({ type: "error", text1: "Failed", text2: msg });
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <View style={styles.logoWrap}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Register to continue</Text>
            </View>

            <View style={styles.form}>
              {/* Role Selector */}
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.roleRow}>
                {(["parent", "teacher", "headmaster"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setFormData({ ...formData, role: r })}
                    style={[
                      styles.roleBtn,
                      formData.role === r && styles.roleBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        formData.role === r && styles.roleTextActive,
                      ]}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Common Fields */}
              <View style={styles.inputWrap}>
                <User
                  size={20}
                  color={colors.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textDim}
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                />
              </View>

              <View style={styles.inputWrap}>
                <Mail
                  size={20}
                  color={colors.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textDim}
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrap}>
                <Lock
                  size={20}
                  color={colors.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textDim}
                  value={formData.password}
                  onChangeText={(t) =>
                    setFormData({ ...formData, password: t })
                  }
                  secureTextEntry
                />
              </View>

              <View style={styles.inputWrap}>
                <Phone
                  size={20}
                  color={colors.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone (optional)"
                  placeholderTextColor={colors.textDim}
                  value={formData.phone}
                  onChangeText={(t) => setFormData({ ...formData, phone: t })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Role-specific Fields */}
              {formData.role === "headmaster" && (
                <View style={styles.inputWrap}>
                  <School
                    size={20}
                    color={colors.textDim}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="School Name"
                    placeholderTextColor={colors.textDim}
                    value={formData.schoolName}
                    onChangeText={(t) =>
                      setFormData({ ...formData, schoolName: t })
                    }
                  />
                </View>
              )}

              {formData.role === "teacher" && (
                <>
                  <Text style={styles.label}>Class Assigned:</Text>
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={formData.classAssigned}
                      onValueChange={(v) =>
                        setFormData({ ...formData, classAssigned: v })
                      }
                      style={styles.picker}
                      dropdownIconColor={colors.white}
                    >
                      <Picker.Item label="Select Class" value="" />
                      <Picker.Item label="Primary 1" value="Primary 1" />
                      <Picker.Item label="Primary 2" value="Primary 2" />
                      <Picker.Item label="Primary 3" value="Primary 3" />
                      <Picker.Item label="Primary 4" value="Primary 4" />
                      <Picker.Item label="Primary 5" value="Primary 5" />
                      <Picker.Item label="Primary 6" value="Primary 6" />
                    </Picker>
                  </View>

                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Subjects (Math, English)"
                      placeholderTextColor={colors.textDim}
                      value={formData.subjects}
                      onChangeText={(t) =>
                        setFormData({ ...formData, subjects: t })
                      }
                    />
                  </View>
                </>
              )}

              {formData.role === "parent" && (
                <>
                  <Text style={styles.label}>Relationship:</Text>
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={formData.relationship}
                      onValueChange={(v) =>
                        setFormData({ ...formData, relationship: v })
                      }
                      style={styles.picker}
                      dropdownIconColor={colors.white}
                    >
                      <Picker.Item label="Select Relationship" value="" />
                      <Picker.Item label="Father" value="father" />
                      <Picker.Item label="Mother" value="mother" />
                      <Picker.Item label="Guardian" value="guardian" />
                    </Picker>
                  </View>

                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Children Admission Numbers (comma separated)"
                      placeholderTextColor={colors.textDim}
                      value={formData.childrenAdmission}
                      onChangeText={(t) =>
                        setFormData({ ...formData, childrenAdmission: t })
                      }
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={handleRegister}
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
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/")}
                style={styles.linkWrap}
              >
                <Text style={styles.linkText}>
                  Already have an account?{" "}
                  <Text style={styles.linkAccent}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  logoWrap: { alignItems: "center", marginBottom: spacing.xl },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: { fontSize: 14, color: colors.textMuted },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  form: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  roleTextActive: { color: colors.white },
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
  input: { flex: 1, paddingVertical: 14, color: colors.white, fontSize: 15 },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  picker: { color: colors.white },
  buttonWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  linkWrap: { marginTop: spacing.md, alignItems: "center" },
  linkText: { color: colors.textMuted, fontSize: 13 },
  linkAccent: { color: colors.accent, fontWeight: "600" },
});
