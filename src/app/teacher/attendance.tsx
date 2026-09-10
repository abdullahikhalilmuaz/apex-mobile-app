import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import { Check, X } from "lucide-react-native";

export default function TeacherAttendance() {
  const [pupils, setPupils] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPupils();
  }, []);

  const fetchPupils = async () => {
    try {
      const res = await api.get("/teacher/pupils");
      setPupils(res.data);
      const initial: Record<string, string> = {};
      res.data.forEach((p: any) => {
        initial[p._id] = "present";
      });
      setAttendance(initial);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>{pupils.length} pupils</Text>

        {pupils.map((p) => (
          <GlassCard key={p._id} style={{ marginBottom: spacing.md }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta}>{p.admissionNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggle(p._id)}
                style={[
                  styles.statusBtn,
                  attendance[p._id] === "present"
                    ? styles.presentBtn
                    : styles.absentBtn,
                ]}
              >
                {attendance[p._id] === "present" ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <X size={16} color={colors.error} />
                )}
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        attendance[p._id] === "present"
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                >
                  {attendance[p._id] === "present" ? "Present" : "Absent"}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { color: colors.white, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  presentBtn: { backgroundColor: colors.successBg },
  absentBtn: { backgroundColor: colors.errorBg },
  statusText: { fontSize: 13, fontWeight: "600" },
});
