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
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../../constants/colors";
import GlassCard from "../../../components/GlassCard";
import appApi from "../../../lib/appApi";

const TERMS = ["First", "Second", "Third"];
const SESSIONS = ["2024/2025", "2025/2026", "2026/2027", "2027/2028"];

type Tab = "overview" | "attendance" | "results" | "assignments";

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [term, setTerm] = useState("First");
  const [session, setSession] = useState("2026/2027");
  const [loading, setLoading] = useState(false);

  const loadStudent = async () => {
    try {
      const res = await appApi.get(`/students/${id}`);
      setStudent(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load student" });
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await appApi.get(`/attendance/student/${id}`);
      setAttendance(res.data);
    } catch {
      setAttendance(null);
    }
  };

  const loadResult = async () => {
    setLoading(true);
    try {
      const res = await appApi.get(
        `/results/student/${id}?term=${term}&session=${session}`,
      );
      setResult(res.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!student?.class) return;
    try {
      const res = await appApi.get(
        `/assignments/class/${encodeURIComponent(student.class)}`,
      );
      setAssignments(res.data);
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    loadStudent();
    loadAttendance();
  }, [id]);

  useEffect(() => {
    if (tab === "results") loadResult();
  }, [tab, term, session]);

  useEffect(() => {
    if (tab === "assignments" && student?.class) loadAssignments();
  }, [tab, student]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: "Attendance" },
    { key: "results", label: "Results" },
    { key: "assignments", label: "Homework" },
  ];

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {student && (
          <>
            <Text style={styles.name}>
              {student.firstName}{" "}
              {student.middleName ? student.middleName + " " : ""}
              {student.lastName}
            </Text>
            <Text style={styles.classText}>{student.class}</Text>
          </>
        )}

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            >
              <Text
                style={[styles.tabText, tab === t.key && styles.tabTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview */}
        {tab === "overview" && (
          <>
            <GlassCard style={{ marginBottom: spacing.md }}>
              <Text style={styles.cardTitle}>Attendance Summary</Text>
              {attendance ? (
                <>
                  <Text style={styles.stat}>
                    Present: {attendance.summary?.present || 0}
                  </Text>
                  <Text style={styles.stat}>
                    Absent: {attendance.summary?.absent || 0}
                  </Text>
                  <Text style={styles.stat}>
                    Late: {attendance.summary?.late || 0}
                  </Text>
                </>
              ) : (
                <Text style={styles.muted}>No attendance data yet</Text>
              )}
            </GlassCard>
          </>
        )}

        {/* Attendance */}
        {tab === "attendance" && (
          <>
            {attendance?.records?.length ? (
              attendance.records.map((r: any) => (
                <GlassCard key={r._id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.attRow}>
                    <Text style={styles.attDate}>
                      {new Date(r.date).toDateString()}
                    </Text>
                    <Text
                      style={[
                        styles.attStatus,
                        r.status === "present" && { color: colors.success },
                        r.status === "absent" && { color: colors.error },
                        r.status === "late" && { color: colors.warning },
                      ]}
                    >
                      {r.status}
                    </Text>
                  </View>
                </GlassCard>
              ))
            ) : (
              <GlassCard>
                <Text style={styles.muted}>No attendance records</Text>
              </GlassCard>
            )}
          </>
        )}

        {/* Results */}
        {tab === "results" && (
          <>
            <GlassCard style={{ marginBottom: spacing.md }}>
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
              <ActivityIndicator color={colors.primary} />
            ) : !result ? (
              <GlassCard>
                <Text style={styles.muted}>
                  No result published for {term} Term, {session}
                </Text>
              </GlassCard>
            ) : (
              <>
                <GlassCard style={{ marginBottom: spacing.md }}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.stat}>Total: {result.totalScore}</Text>
                    <Text style={styles.stat}>Average: {result.average}</Text>
                    <Text style={styles.stat}>
                      Position: {result.position} / {result.outOf}
                    </Text>
                  </View>
                </GlassCard>

                {result.subjects?.map((sub: any) => (
                  <GlassCard
                    key={sub.subject}
                    style={{ marginBottom: spacing.sm }}
                  >
                    <View style={styles.subjectRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subjectName}>{sub.subject}</Text>
                        <Text style={styles.subjectMeta}>
                          CA: {sub.ca} • Exam: {sub.exam}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.totalText}>{sub.total}</Text>
                        <Text style={styles.gradeText}>{sub.grade}</Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </>
            )}
          </>
        )}

        {/* Assignments */}
        {tab === "assignments" && (
          <>
            {assignments.length === 0 ? (
              <GlassCard>
                <Text style={styles.muted}>No assignments posted yet</Text>
              </GlassCard>
            ) : (
              assignments.map((a) => (
                <GlassCard key={a._id} style={{ marginBottom: spacing.sm }}>
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text style={styles.assignmentMeta}>
                    {a.subject ? a.subject : "All subjects"}
                    {a.topic ? ` • ${a.topic}` : ""}
                  </Text>
                  {a.description ? (
                    <Text style={styles.assignmentDesc}>{a.description}</Text>
                  ) : null}
                  <Text style={styles.assignmentDate}>
                    Posted {new Date(a.createdAt).toDateString()}
                  </Text>
                </GlassCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  backText: { color: colors.white, fontSize: 14 },
  name: { color: colors.white, fontSize: 24, fontWeight: "700" },
  classText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radius.full,
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: colors.white },
  cardTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  stat: { color: colors.white, fontSize: 14, marginBottom: 4 },
  muted: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    marginTop: 6,
  },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  attRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attDate: { color: colors.white, fontSize: 13 },
  attStatus: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  resultHeader: { flexDirection: "row", justifyContent: "space-between" },
  subjectRow: { flexDirection: "row", alignItems: "center" },
  subjectName: { color: colors.white, fontSize: 14, fontWeight: "600" },
  subjectMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  totalText: { color: colors.primary, fontSize: 18, fontWeight: "700" },
  gradeText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  assignmentTitle: { color: colors.white, fontSize: 15, fontWeight: "700" },
  assignmentMeta: { color: colors.primary, fontSize: 12, marginTop: 4 },
  assignmentDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  assignmentDate: { color: colors.textDim, fontSize: 11, marginTop: 8 },
});
