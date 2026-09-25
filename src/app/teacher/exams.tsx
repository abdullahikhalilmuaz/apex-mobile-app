import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Plus,
  FileText,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import appApi from "../../lib/appApi";

type Exam = {
  _id: string;
  title: string;
  class: string;
  subject: string;
  term: string;
  session: string;
  status: string;
  totalMarks: number;
  duration: string;
  objectives?: any[];
  essays?: any[];
  fillBlanks?: any[];
};

export default function TeacherExams() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await appApi.get("/exams/teacher");
      setExams(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load exams" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete exam?", "This removes all questions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await appApi.delete(`/exams/${id}`);
            Toast.show({ type: "success", text1: "Deleted" });
            load();
          } catch {
            Toast.show({ type: "error", text1: "Failed" });
          }
        },
      },
    ]);
  };

  const statusIcon = (s: string) => {
    if (s === "submitted")
      return <CheckCircle2 size={16} color={colors.success} />;
    if (s === "reviewed") return <CheckCircle2 size={16} color={colors.info} />;
    return <Clock size={16} color={colors.warning} />;
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Exam Questions</Text>
            <Text style={styles.subtitle}>Set exam papers per subject</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/teacher/exam-editor" as any)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : exams.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No exams yet. Tap + to create one.</Text>
          </GlassCard>
        ) : (
          exams.map((e) => (
            <TouchableOpacity
              key={e._id}
              onPress={() =>
                router.push(`/teacher/exam-editor?id=${e._id}` as any)
              }
              activeOpacity={0.85}
            >
              <GlassCard style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View style={styles.iconWrap}>
                    <FileText size={20} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.examTitle}>{e.subject}</Text>
                    <Text style={styles.examMeta}>
                      {e.class} · {e.term} Term · {e.session}
                    </Text>
                    <View style={styles.statusRow}>
                      {statusIcon(e.status)}
                      <Text style={styles.statusText}>
                        {e.status === "submitted"
                          ? "Submitted"
                          : e.status === "reviewed"
                            ? "Reviewed"
                            : "Draft"}
                      </Text>
                      <Text style={styles.dot}>·</Text>
                      <Text style={styles.statusText}>
                        {e.objectives?.length || 0} obj ·{" "}
                        {e.essays?.length || 0} essay ·{" "}
                        {e.fillBlanks?.length || 0} fill
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(e._id)}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                  <ChevronRight size={18} color={colors.textDim} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { color: colors.textMuted, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  examTitle: { color: colors.white, fontSize: 15, fontWeight: "700" },
  examMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  statusText: { color: colors.textMuted, fontSize: 11 },
  dot: { color: colors.textDim, marginHorizontal: 4 },
});
