import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import appApi from "../../lib/appApi";

const CLASSES = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
];

type Student = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
};

type Status = "present" | "absent" | "late" | "excused";

export default function TeacherAttendance() {
  const [className, setClassName] = useState("Primary 5");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [studentsRes, attRes] = await Promise.all([
        appApi.get(`/students/class/${encodeURIComponent(className)}`),
        appApi.get(
          `/attendance/class/${encodeURIComponent(className)}?date=${date}`,
        ),
      ]);
      setStudents(studentsRes.data);

      const existing: Record<string, Status> = {};
      attRes.data.forEach((r: any) => {
        existing[r.studentId._id || r.studentId] = r.status;
      });
      setMarks(existing);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [className, date]);

  const setStatus = (id: string, status: Status) => {
    setMarks({ ...marks, [id]: status });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: marks[s._id] || "present",
      }));
      await appApi.post("/attendance", {
        class: className,
        date,
        records,
      });
      Toast.show({ type: "success", text1: "Attendance saved" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const statuses: Status[] = ["present", "absent", "late", "excused"];
  const statusColors: Record<Status, string> = {
    present: colors.success,
    absent: colors.error,
    late: colors.warning,
    excused: colors.info,
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Mark today's class</Text>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={className}
              onValueChange={(v) => setClassName(v)}
              dropdownIconColor={colors.white}
              style={{ color: colors.white }}
            >
              {CLASSES.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Date</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => {
                const d = new Date(date);
                d.setDate(d.getDate() - 1);
                setDate(d.toISOString().slice(0, 10));
              }}
            >
              <Text style={styles.dateBtnText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>{date}</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => {
                const d = new Date(date);
                d.setDate(d.getDate() + 1);
                setDate(d.toISOString().slice(0, 10));
              }}
            >
              <Text style={styles.dateBtnText}>▶</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : students.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No students in {className}.</Text>
          </GlassCard>
        ) : (
          students.map((s) => {
            const current: Status = marks[s._id] || "present";
            return (
              <GlassCard key={s._id} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.studentName}>
                  {s.firstName} {s.middleName ? s.middleName + " " : ""}
                  {s.lastName}
                </Text>
                <View style={styles.statusRow}>
                  {statuses.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        current === st && {
                          backgroundColor: statusColors[st],
                        },
                      ]}
                      onPress={() => setStatus(s._id, st)}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          current === st && {
                            color: colors.white,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>
            );
          })
        )}

        {students.length > 0 && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Attendance"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  dateBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBtnText: { color: colors.white, fontSize: 18 },
  dateText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  empty: { color: colors.textMuted, textAlign: "center" },
  studentName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  statusText: { color: colors.textMuted, fontSize: 12 },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
