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
import { Check, X, Save, History } from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function TeacherAttendance() {
  const [pupils, setPupils] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherClass, setTeacherClass] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teacherRes, historyRes] = await Promise.all([
        api.get("/teacher/profile"),
        api.get("/attendance/teacher/history?days=30"),
      ]);

      const className = teacherRes.data.classAssigned;
      setTeacherClass(className);

      const pupilsRes = await api.get(`/pupils/class/${className}`);
      setPupils(pupilsRes.data);

      const initial: Record<string, string> = {};
      pupilsRes.data.forEach((p: any) => {
        initial[p._id] = "present";
      });
      setAttendance(initial);

      setHistory(historyRes.data);
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

  const handleSave = async () => {
    if (pupils.length === 0) return;

    setSaving(true);
    try {
      const data = {
        class: teacherClass,
        attendance: pupils.map((p) => ({
          pupilId: p._id,
          status: attendance[p._id] || "present",
        })),
        term: "First",
        session: "2024/2025",
      };

      await api.post("/attendance/mark", data);
      Toast.show({
        type: "success",
        text1: "Attendance saved! ✅",
        text2: `${pupils.length} pupils marked`,
      });

      // Refresh history
      const historyRes = await api.get("/attendance/teacher/history?days=30");
      setHistory(historyRes.data);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to save",
        text2: error?.response?.data?.error || "Try again",
      });
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.subtitle}>
          {teacherClass} • {pupils.length} pupils
        </Text>

        {pupils.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No pupils in {teacherClass}</Text>
          </GlassCard>
        ) : (
          <>
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

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Save size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Save Attendance"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.historyHeader}>
          <History size={20} color={colors.white} />
          <Text style={styles.historyTitle}>History (Last 30 Days)</Text>
        </View>

        {history.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No attendance history</Text>
          </GlassCard>
        ) : (
          history.slice(0, 50).map((record) => (
            <GlassCard key={record._id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {record.pupilId?.name || "Unknown"}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    record.status === "present"
                      ? styles.presentBtn
                      : styles.absentBtn,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          record.status === "present"
                            ? colors.success
                            : colors.error,
                        textTransform: "capitalize",
                      },
                    ]}
                  >
                    {record.status}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { color: colors.white, fontSize: 15, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  presentBtn: { backgroundColor: colors.successBg },
  absentBtn: { backgroundColor: colors.errorBg },
  statusText: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  historyTitle: { color: colors.white, fontSize: 18, fontWeight: "700" },
});
