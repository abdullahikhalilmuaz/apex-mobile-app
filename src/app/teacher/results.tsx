import { useEffect, useRef, useState } from "react";
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
import {
  saveDraft,
  loadDraft,
  clearDraft,
  addPending,
  DraftScores,
} from "../../lib/resultsDraft";

const CLASSES = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
];

const SUBJECTS = [
  "English Studies",
  "Mathematics",
  "Basic Science",
  "Basic Technology",
  "Computer Studies",
  "Physical and Health Education",
  "Social Studies",
  "Civic Education",
  "Security Education",
  "Islamic Religion Studies",
  "Christian Religion Studies",
  "Agricultural Science",
  "Home Economics",
  "Yoruba",
  "Hausa",
  "Igbo",
  "French",
  "Arabic",
  "Cultural and Creative Arts",
  "History",
];

const TERMS = ["First", "Second", "Third"];
const SESSIONS = ["2024/2025", "2025/2026", "2026/2027", "2027/2028"];

type Student = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
};

type SubScore = { ca1: number; ca2: number; ca3: number; exam: number };

export default function TeacherResults() {
  const [className, setClassName] = useState("Primary 5");
  const [term, setTerm] = useState("First");
  const [session, setSession] = useState("2026/2027");
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<
    Record<string, { [subject: string]: SubScore }>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    setLoading(true);
    setOfflineMode(false);
    try {
      const studentsRes = await appApi.get(
        `/students/class/${encodeURIComponent(className)}`,
      );
      setStudents(studentsRes.data);

      let existing: any[] = [];
      try {
        const resRes = await appApi.get(
          `/results/class/${encodeURIComponent(className)}?term=${term}&session=${encodeURIComponent(session)}`,
        );
        existing = resRes.data;
        setHasExisting(existing.length > 0);
      } catch {
        setHasExisting(false);
      }

      const merged: Record<string, { [subject: string]: SubScore }> = {};
      existing.forEach((r: any) => {
        const sid = r.studentId?._id || r.studentId;
        if (!sid) return;
        merged[sid] = {};
        r.subjects.forEach((s: any) => {
          merged[sid][s.subject] = {
            ca1: s.ca1 ?? s.ca ?? 0,
            ca2: s.ca2 || 0,
            ca3: s.ca3 || 0,
            exam: s.exam || 0,
          };
        });
      });

      const draft = await loadDraft(className, term, session);
      if (draft) {
        Object.keys(draft).forEach((sid) => {
          merged[sid] = { ...(merged[sid] || {}), ...(draft as any)[sid] };
        });
      }

      setScores(merged);
    } catch (err: any) {
      console.error("Load error:", err?.message);
      setOfflineMode(true);
      const draft = await loadDraft(className, term, session);
      if (draft) setScores(draft as any);
      Toast.show({
        type: "error",
        text1: "Offline",
        text2: "Loaded from local draft",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [className, term, session]);

  useEffect(() => {
    if (loading) return;
    if (Object.keys(scores).length === 0) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(className, term, session, scores as DraftScores);
    }, 500);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [scores, className, term, session, loading]);

  const updateScore = (
    studentId: string,
    subject: string,
    field: keyof SubScore,
    value: string,
  ) => {
    const num = parseInt(value || "0");
    setScores((prev) => {
      const studentScores = prev[studentId] || {};
      const subjectScore = studentScores[subject] || {
        ca1: 0,
        ca2: 0,
        ca3: 0,
        exam: 0,
      };
      return {
        ...prev,
        [studentId]: {
          ...studentScores,
          [subject]: {
            ...subjectScore,
            [field]: isNaN(num) ? 0 : num,
          },
        },
      };
    });
  };

  const buildPayload = () => {
    return students.map((s) => {
      const studentScores = scores[s._id] || {};
      const subjects = SUBJECTS.filter((sub) => {
        const sc = studentScores[sub];
        if (!sc) return false;
        return sc.ca1 > 0 || sc.ca2 > 0 || sc.ca3 > 0 || sc.exam > 0;
      }).map((sub) => ({
        subject: sub,
        ca1: studentScores[sub]?.ca1 || 0,
        ca2: studentScores[sub]?.ca2 || 0,
        ca3: studentScores[sub]?.ca3 || 0,
        exam: studentScores[sub]?.exam || 0,
      }));
      return { studentId: s._id, subjects };
    });
  };

  const handleSave = async () => {
    if (students.length === 0) return;
    setSaving(true);
    const payload = buildPayload();
    try {
      await appApi.post("/results", {
        class: className,
        term,
        session,
        results: payload,
      });
      await clearDraft(className, term, session);
      setHasExisting(true);
      setOfflineMode(false);
      Toast.show({
        type: "success",
        text1: hasExisting ? "Results updated" : "Results published",
      });
    } catch (err: any) {
      const isNetwork =
        !err?.response ||
        err?.code === "ECONNABORTED" ||
        err?.message?.includes("Network");
      if (isNetwork) {
        await addPending({
          id: `${className}_${term}_${session}_${Date.now()}`,
          className,
          term,
          session,
          results: payload,
          createdAt: Date.now(),
        });
        setOfflineMode(true);
        Toast.show({
          type: "success",
          text1: "Saved offline",
          text2: "Will auto-upload when online",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: err?.response?.data?.error || "Try again",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const buttonLabel = saving
    ? "Saving..."
    : hasExisting
      ? `Update ${term} Term Results`
      : `Publish ${term} Term Results`;

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          {hasExisting ? "Edit Results" : "Publish Results"}
        </Text>
        <Text style={styles.subtitle}>
          {offlineMode
            ? "⚠️ Offline — changes saved locally, will sync when online"
            : "Enter 3 CAs (each /10) + Exam (/70) per subject"}
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
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: spacing.md }}
                  >
                    <View>
                      <View style={styles.subjectHeader}>
                        <Text style={[styles.subjectLabel, { width: 120 }]}>
                          Subject
                        </Text>
                        <Text style={[styles.subjectLabel, styles.colCA]}>
                          CA1
                        </Text>
                        <Text style={[styles.subjectLabel, styles.colCA]}>
                          CA2
                        </Text>
                        <Text style={[styles.subjectLabel, styles.colCA]}>
                          CA3
                        </Text>
                        <Text style={[styles.subjectLabel, styles.colExam]}>
                          Exam
                        </Text>
                        <Text style={[styles.subjectLabel, styles.colTotal]}>
                          Total
                        </Text>
                      </View>
                      {SUBJECTS.map((sub) => {
                        const cs = studentScores[sub] || {
                          ca1: 0,
                          ca2: 0,
                          ca3: 0,
                          exam: 0,
                        };
                        const total = cs.ca1 + cs.ca2 + cs.ca3 + cs.exam;
                        return (
                          <View key={sub} style={styles.subjectRow}>
                            <Text
                              style={[styles.subjectName, { width: 120 }]}
                              numberOfLines={1}
                            >
                              {sub}
                            </Text>
                            {(["ca1", "ca2", "ca3"] as const).map((f) => (
                              <TextInput
                                key={f}
                                style={[styles.scoreInput, styles.colCA]}
                                keyboardType="number-pad"
                                value={cs[f] ? String(cs[f]) : ""}
                                onChangeText={(t) =>
                                  updateScore(s._id, sub, f, t)
                                }
                                maxLength={2}
                                placeholder="0"
                                placeholderTextColor={colors.textDim}
                              />
                            ))}
                            <TextInput
                              style={[styles.scoreInput, styles.colExam]}
                              keyboardType="number-pad"
                              value={cs.exam ? String(cs.exam) : ""}
                              onChangeText={(t) =>
                                updateScore(s._id, sub, "exam", t)
                              }
                              maxLength={2}
                              placeholder="0"
                              placeholderTextColor={colors.textDim}
                            />
                            <Text style={[styles.totalText, styles.colTotal]}>
                              {total}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </GlassCard>
            );
          })
        )}

        {students.length > 0 && (
          <TouchableOpacity
            style={[styles.publishBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.publishBtnText}>{buttonLabel}</Text>
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
  subjectLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  subjectName: { color: colors.white, fontSize: 11 },
  scoreInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.sm,
    paddingVertical: 6,
    textAlign: "center",
    color: colors.white,
    fontSize: 12,
  },
  colCA: { width: 44, textAlign: "center" },
  colExam: { width: 52, textAlign: "center" },
  colTotal: { width: 50, textAlign: "center" },
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
