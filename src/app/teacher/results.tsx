import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
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

const SUBJECTS = [
  "English",
  "Mathematics",
  "Basic Science",
  "Social Studies",
  "Civic Education",
  "Computer Studies",
  "Arabic",
  "IRS",
  "Handwriting",
  "Phonics",
  "Verbal Reasoning",
  "Quantitative Reasoning",
];

const TERMS = ["First", "Second", "Third"];
const SESSIONS = ["2024/2025", "2025/2026", "2026/2027", "2027/2028"];

type Student = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
};
type SubjectScores = { [subject: string]: { ca: number; exam: number } };

export default function TeacherResults() {
  const [className, setClassName] = useState("Primary 5");
  const [term, setTerm] = useState("First");
  const [session, setSession] = useState("2026/2027");
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, SubjectScores>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStudent, setActiveStudent] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await appApi.get(
        `/students/class/${encodeURIComponent(className)}`,
      );
      setStudents(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load students" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [className]);

  const updateScore = (
    studentId: string,
    subject: string,
    field: "ca" | "exam",
    value: string,
  ) => {
    const num = parseInt(value || "0");
    setScores((prev) => {
      const studentScores = prev[studentId] || {};
      const subjectScore = studentScores[subject] || { ca: 0, exam: 0 };
      return {
        ...prev,
        [studentId]: {
          ...studentScores,
          [subject]: { ...subjectScore, [field]: isNaN(num) ? 0 : num },
        },
      };
    });
  };

  const handlePublish = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const results = students.map((s) => {
        const studentScores = scores[s._id] || {};
        const subjects = SUBJECTS.map((sub) => ({
          subject: sub,
          ca: studentScores[sub]?.ca || 0,
          exam: studentScores[sub]?.exam || 0,
        }));
        return { studentId: s._id, subjects };
      });

      await appApi.post("/results", {
        class: className,
        term,
        session,
        results,
      });
      Toast.show({ type: "success", text1: "Results published" });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to publish",
        text2: err?.response?.data?.error || "Try again",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Publish Results</Text>
        <Text style={styles.subtitle}>
          Enter CA and Exam scores per subject
        </Text>

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

          <Text style={styles.label}>Term</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={term}
              onValueChange={(v) => setTerm(v)}
              dropdownIconColor={colors.white}
              style={{ color: colors.white }}
            >
              {TERMS.map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Session</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={session}
              onValueChange={(v) => setSession(v)}
              dropdownIconColor={colors.white}
              style={{ color: colors.white }}
            >
              {SESSIONS.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : students.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No students in {className}</Text>
          </GlassCard>
        ) : (
          students.map((s) => {
            const isActive = activeStudent === s._id;
            const studentScores = scores[s._id] || {};
            return (
              <GlassCard key={s._id} style={{ marginBottom: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setActiveStudent(isActive ? null : s._id)}
                  style={styles.studentToggle}
                >
                  <Text style={styles.studentName}>
                    {s.firstName} {s.middleName ? s.middleName + " " : ""}
                    {s.lastName}
                  </Text>
                  <Text style={styles.expandText}>{isActive ? "−" : "+"}</Text>
                </TouchableOpacity>

                {isActive && (
                  <View style={{ marginTop: spacing.md }}>
                    <View style={styles.subjectHeader}>
                      <Text style={[styles.subjectLabel, { flex: 2 }]}>
                        Subject
                      </Text>
                      <Text
                        style={[
                          styles.subjectLabel,
                          { width: 60, textAlign: "center" },
                        ]}
                      >
                        CA
                      </Text>
                      <Text
                        style={[
                          styles.subjectLabel,
                          { width: 60, textAlign: "center" },
                        ]}
                      >
                        Exam
                      </Text>
                      <Text
                        style={[
                          styles.subjectLabel,
                          { width: 50, textAlign: "center" },
                        ]}
                      >
                        Total
                      </Text>
                    </View>
                    {SUBJECTS.map((sub) => {
                      const cs = studentScores[sub] || { ca: 0, exam: 0 };
                      const total = cs.ca + cs.exam;
                      return (
                        <View key={sub} style={styles.subjectRow}>
                          <Text style={[styles.subjectName, { flex: 2 }]}>
                            {sub}
                          </Text>
                          <TextInput
                            style={[styles.scoreInput, { width: 60 }]}
                            keyboardType="number-pad"
                            value={cs.ca ? String(cs.ca) : ""}
                            onChangeText={(t) =>
                              updateScore(s._id, sub, "ca", t)
                            }
                            maxLength={2}
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                          />
                          <TextInput
                            style={[styles.scoreInput, { width: 60 }]}
                            keyboardType="number-pad"
                            value={cs.exam ? String(cs.exam) : ""}
                            onChangeText={(t) =>
                              updateScore(s._id, sub, "exam", t)
                            }
                            maxLength={2}
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                          />
                          <Text
                            style={[
                              styles.totalText,
                              { width: 50, textAlign: "center" },
                            ]}
                          >
                            {total}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </GlassCard>
            );
          })
        )}

        {students.length > 0 && (
          <TouchableOpacity
            style={[styles.publishBtn, saving && { opacity: 0.6 }]}
            onPress={handlePublish}
            disabled={saving}
          >
            <Text style={styles.publishBtnText}>
              {saving ? "Publishing..." : `Publish ${term} Term Results`}
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
  empty: { color: colors.textMuted, textAlign: "center" },
  studentToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: { color: colors.white, fontSize: 15, fontWeight: "600" },
  expandText: { color: colors.primary, fontSize: 22, fontWeight: "700" },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    paddingBottom: 6,
    marginBottom: 6,
  },
  subjectLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  subjectName: { color: colors.white, fontSize: 12 },
  scoreInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.sm,
    paddingVertical: 6,
    textAlign: "center",
    color: colors.white,
    fontSize: 13,
  },
  totalText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  publishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  publishBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
