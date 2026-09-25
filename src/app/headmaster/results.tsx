import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { ChevronDown, Trophy, Users, TrendingUp } from "lucide-react-native";
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
const TERMS = ["First", "Second", "Third"];
const SESSIONS = ["2024/2025", "2025/2026", "2026/2027", "2027/2028"];

type Subject = {
  subject: string;
  ca1?: number;
  ca2?: number;
  ca3?: number;
  ca?: number;
  exam: number;
  total: number;
  grade: string;
};

type StudentResult = {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  term: string;
  session: string;
  subjects: Subject[];
  totalScore: number;
  average: number;
  position: number;
  outOf: number;
  attendanceSummary?: {
    present: number;
    absent: number;
    total: number;
  };
};

export default function HeadmasterResults() {
  const [className, setClassName] = useState("Primary 1");
  const [term, setTerm] = useState("First");
  const [session, setSession] = useState("2026/2027");

  const [results, setResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState({
    enrollment: 0,
    highestAvg: 0,
    lowestAvg: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [resultsRes, statsRes] = await Promise.all([
        appApi
          .get(
            `/results/class/${encodeURIComponent(className)}?term=${term}&session=${encodeURIComponent(session)}`,
          )
          .catch(() => ({ data: [] })),
        appApi
          .get(
            `/results/class/${encodeURIComponent(className)}/stats?term=${term}&session=${encodeURIComponent(session)}`,
          )
          .catch(() => ({
            data: { enrollment: 0, highestAvg: 0, lowestAvg: 0 },
          })),
      ]);
      setResults(resultsRes.data || []);
      setStats(statsRes.data || { enrollment: 0, highestAvg: 0, lowestAvg: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [className, term, session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>View published results by class</Text>

        {/* Filters */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={className}
              onValueChange={(v) => {
                setClassName(v);
                setExpandedId(null);
              }}
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
              onValueChange={(v) => {
                setTerm(v);
                setExpandedId(null);
              }}
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
              onValueChange={(v) => {
                setSession(v);
                setExpandedId(null);
              }}
              dropdownIconColor={colors.white}
              style={{ color: colors.white }}
            >
              {SESSIONS.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {/* Stats summary */}
        {!loading && results.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Users size={16} color={colors.primary} />
              <Text style={styles.statValue}>{stats.enrollment}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statBox}>
              <Trophy size={16} color={colors.success} />
              <Text style={styles.statValue}>{stats.highestAvg}%</Text>
              <Text style={styles.statLabel}>Highest</Text>
            </View>
            <View style={styles.statBox}>
              <TrendingUp size={16} color={colors.warning} />
              <Text style={styles.statValue}>{stats.lowestAvg}%</Text>
              <Text style={styles.statLabel}>Lowest</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : results.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>
              No results published for {className} · {term} Term · {session}
            </Text>
          </GlassCard>
        ) : (
          results.map((r, idx) => {
            const sid = r.studentId?._id || "";
            const isOpen = expandedId === sid;
            const fullName = r.studentId
              ? `${r.studentId.firstName} ${
                  r.studentId.middleName ? r.studentId.middleName + " " : ""
                }${r.studentId.lastName}`
              : "Unknown";

            const posColor =
              r.position === 1
                ? colors.warning
                : r.position <= 3
                  ? colors.success
                  : colors.textMuted;

            return (
              <GlassCard key={r._id} style={{ marginBottom: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setExpandedId(isOpen ? null : sid)}
                  style={styles.rowHeader}
                  activeOpacity={0.8}
                >
                  <View style={[styles.posBadge, { borderColor: posColor }]}>
                    <Text style={[styles.posText, { color: posColor }]}>
                      {r.position}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{fullName}</Text>
                    <Text style={styles.studentMeta}>
                      Total: {r.totalScore} · Avg: {r.average}%
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color={colors.textDim}
                    style={{
                      transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                    }}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.subjectList}>
                    <View style={styles.subjectHeaderRow}>
                      <Text style={[styles.subjectCol, { flex: 2 }]}>
                        Subject
                      </Text>
                      <Text style={[styles.subjectCol, styles.centerCol]}>
                        CA
                      </Text>
                      <Text style={[styles.subjectCol, styles.centerCol]}>
                        Exam
                      </Text>
                      <Text style={[styles.subjectCol, styles.centerCol]}>
                        Total
                      </Text>
                      <Text style={[styles.subjectCol, styles.centerCol]}>
                        Grade
                      </Text>
                    </View>

                    {r.subjects?.map((s, i) => {
                      const ca =
                        (s.ca1 || s.ca || 0) + (s.ca2 || 0) + (s.ca3 || 0);
                      return (
                        <View key={i} style={styles.subjectRow}>
                          <Text style={[styles.subjectName, { flex: 2 }]}>
                            {s.subject}
                          </Text>
                          <Text style={[styles.subjectValue, styles.centerCol]}>
                            {ca}
                          </Text>
                          <Text style={[styles.subjectValue, styles.centerCol]}>
                            {s.exam}
                          </Text>
                          <Text
                            style={[
                              styles.subjectValue,
                              styles.centerCol,
                              { color: colors.primary, fontWeight: "700" },
                            ]}
                          >
                            {s.total}
                          </Text>
                          <Text
                            style={[
                              styles.subjectValue,
                              styles.centerCol,
                              {
                                color:
                                  s.grade === "A"
                                    ? colors.success
                                    : s.grade === "F"
                                      ? colors.error
                                      : colors.textMuted,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {s.grade}
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
    fontSize: 12,
    marginBottom: 4,
    marginTop: 6,
  },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: 4,
  },
  statValue: { color: colors.white, fontSize: 18, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 11 },

  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  posBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  posText: { fontSize: 15, fontWeight: "800" },
  studentName: { color: colors.white, fontSize: 15, fontWeight: "600" },
  studentMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  subjectList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: spacing.sm,
  },
  subjectHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    marginBottom: 6,
  },
  subjectCol: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  centerCol: { width: 48, textAlign: "center" },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  subjectName: { color: colors.white, fontSize: 12.5 },
  subjectValue: { fontSize: 12.5, color: colors.textMuted },
});
