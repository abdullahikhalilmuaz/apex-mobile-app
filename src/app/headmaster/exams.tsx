import { useCallback, useState } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { FileText, ChevronRight } from "lucide-react-native";
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

type Exam = {
  _id: string;
  title: string;
  class: string;
  subject: string;
  term: string;
  session: string;
  status: string;
  teacherName?: string;
  objectives?: any[];
  essays?: any[];
  fillBlanks?: any[];
};

export default function HeadmasterExams() {
  const router = useRouter();
  const [className, setClassName] = useState("Primary 5");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await appApi.get(
        `/exams/class/${encodeURIComponent(className)}`,
      );
      setExams(res.data);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [className]),
  );

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
        <Text style={styles.title}>Exam Questions</Text>
        <Text style={styles.subtitle}>Browse papers submitted by teachers</Text>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={className}
              onValueChange={setClassName}
              style={{ color: colors.white }}
              dropdownIconColor={colors.white}
            >
              {CLASSES.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : exams.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No submitted exams for {className}</Text>
          </GlassCard>
        ) : (
          exams.map((e) => (
            <TouchableOpacity
              key={e._id}
              onPress={() =>
                router.push(`/headmaster/exam-view?id=${e._id}` as any)
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
                      {e.term} Term · {e.session}
                    </Text>
                    <Text style={styles.examMeta2}>
                      Teacher: {e.teacherName || "—"} ·{" "}
                      {e.objectives?.length || 0} obj · {e.essays?.length || 0}{" "}
                      essay · {e.fillBlanks?.length || 0} fill
                    </Text>
                  </View>
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
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
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
  examMeta2: { color: colors.textDim, fontSize: 11, marginTop: 2 },
});
