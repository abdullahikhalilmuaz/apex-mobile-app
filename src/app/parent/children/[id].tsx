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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, spacing, radius } from "../../../constants/colors";
import GlassCard from "../../../components/GlassCard";
import api from "../../../lib/api";

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [child, setChild] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [childRes, resultsRes, attendanceRes] = await Promise.all([
        api.get(`/pupils/${id}`),
        api.get(`/results/parent/child/${id}`),
        api.get(`/attendance/parent/child/${id}?days=30`),
      ]);
      setChild(childRes.data);
      setResults(resultsRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    subjects: results.length,
    average:
      results.length > 0
        ? Math.round(
            results.reduce((acc, r) => acc + r.total, 0) / results.length,
          )
        : 0,
    attendance: attendance.filter((a) => a.status === "present").length || 0,
    totalDays: attendance.length || 1,
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
          <Text style={styles.backText}>Back to Children</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{child?.name}</Text>
        <Text style={styles.subtitle}>
          {child?.class} • Admission: {child?.admissionNumber}
        </Text>

        <View style={styles.statsGrid}>
          <StatCard
            icon="book-outline"
            value={stats.subjects}
            label="Subjects"
          />
          <StatCard
            icon="checkmark-circle-outline"
            value={`${stats.average}%`}
            label="Average"
          />
          <StatCard
            icon="time-outline"
            value={`${Math.round((stats.attendance / stats.totalDays) * 100)}%`}
            label="Attendance"
          />
        </View>

        <Text style={styles.sectionTitle}>Results</Text>
        <GlassCard style={{ marginBottom: spacing.lg }}>
          {results.length === 0 ? (
            <Text style={styles.empty}>No results available</Text>
          ) : (
            results.map((r) => (
              <View key={r._id} style={styles.resultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultSubject}>{r.subject}</Text>
                  <Text style={styles.resultMeta}>
                    CA: {r.caScore} · Exam: {r.examScore}
                  </Text>
                </View>
                <Text style={styles.resultTotal}>{r.total}</Text>
                <View
                  style={[
                    styles.gradeBadge,
                    { backgroundColor: gradeColor(r.grade).bg },
                  ]}
                >
                  <Text
                    style={[styles.gradeText, { color: gradeColor(r.grade).fg }]}
                  >
                    {r.grade}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>Attendance History</Text>
        <GlassCard>
          {attendance.length === 0 ? (
            <Text style={styles.empty}>No attendance records</Text>
          ) : (
            attendance.slice(0, 20).map((a) => (
              <View key={a._id} style={styles.attRow}>
                <Text style={styles.attDate}>
                  {new Date(a.date).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        a.status === "present"
                          ? "rgba(52, 211, 153, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: a.status === "present" ? "#34d399" : "#f87171",
                      },
                    ]}
                  >
                    {a.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: any;
  value: any;
  label: string;
}) {
  return (
    <GlassCard style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={22} color={colors.white} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function gradeColor(grade: string) {
  switch (grade) {
    case "A":
      return { bg: "rgba(52, 211, 153, 0.3)", fg: "#34d399" };
    case "B":
      return { bg: "rgba(96, 165, 250, 0.3)", fg: "#60a5fa" };
    case "C":
      return { bg: "rgba(251, 191, 36, 0.3)", fg: "#fbbf24" };
    case "D":
      return { bg: "rgba(251, 146, 60, 0.3)", fg: "#fb923c" };
    default:
      return { bg: "rgba(239, 68, 68, 0.3)", fg: "#f87171" };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  backText: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },

  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { color: colors.white, fontSize: 20, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  resultSubject: { color: colors.white, fontSize: 15, fontWeight: "500" },
  resultMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  resultTotal: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 12,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: { fontWeight: "700", fontSize: 13 },

  attRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  attDate: { color: colors.white, fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
});