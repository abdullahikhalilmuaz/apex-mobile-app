import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Printer } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import appApi from "../../lib/appApi";
import { generateAndShareExamPDF } from "../../lib/generateExamPDF";

export default function ExamView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await appApi.get(`/exams/${id}`);
        setExam(res.data);
      } catch {
        Toast.show({ type: "error", text1: "Failed to load" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = async () => {
    if (!exam) return;
    setPrinting(true);
    try {
      await generateAndShareExamPDF(exam);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Print failed",
        text2: err?.message || "",
      });
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
      </LinearGradient>
    );
  }

  if (!exam) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <Text style={styles.empty}>Exam not found</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Exam Paper</Text>
          <View style={{ width: 32 }} />
        </View>

        <Text style={styles.examTitle}>{exam.subject}</Text>
        <Text style={styles.examMeta}>
          {exam.class} · {exam.term} Term · {exam.session}
        </Text>
        <Text style={styles.examMeta2}>
          Duration: {exam.duration} · Total: {exam.totalMarks} marks · Teacher:{" "}
          {exam.teacherName}
        </Text>

        <TouchableOpacity
          style={[styles.printBtn, printing && { opacity: 0.6 }]}
          onPress={handlePrint}
          disabled={printing}
        >
          <Printer size={18} color={colors.white} />
          <Text style={styles.printBtnText}>
            {printing ? "Generating..." : "Print / Save as PDF"}
          </Text>
        </TouchableOpacity>

        {/* Objectives */}
        {exam.objectives?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SECTION A · OBJECTIVE</Text>
            {exam.objectives.map((o: any) => (
              <GlassCard key={o.number} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.qText}>
                  {o.number}. {o.text}
                </Text>
                {o.options?.map((opt: string, i: number) => (
                  <Text key={i} style={styles.optText}>
                    {"   "}
                    {String.fromCharCode(65 + i)}. {opt}
                    {o.correct === String.fromCharCode(65 + i) ? "  ✓" : ""}
                  </Text>
                ))}
              </GlassCard>
            ))}
          </>
        )}

        {/* Essays */}
        {exam.essays?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SECTION B · ESSAY</Text>
            {exam.essays.map((e: any) => (
              <GlassCard key={e.number} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.qText}>
                  {e.number}. {e.text}
                </Text>
                <Text style={styles.marksText}>({e.marks} marks)</Text>
              </GlassCard>
            ))}
          </>
        )}

        {/* Fill blanks */}
        {exam.fillBlanks?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              SECTION C · FILL IN THE BLANK
            </Text>
            {exam.fillBlanks.map((fb: any) => (
              <GlassCard key={fb.number} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.qText}>
                  {fb.number}. {fb.text}
                </Text>
                <Text style={styles.answerText}>Answer: {fb.answer}</Text>
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backBtn: { padding: 6 },
  topTitle: { color: colors.white, fontSize: 18, fontWeight: "700" },
  examTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  examMeta: { color: colors.textMuted, fontSize: 13 },
  examMeta2: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  printBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  sectionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    paddingBottom: 6,
  },
  qText: { color: colors.white, fontSize: 14, marginBottom: 6 },
  optText: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  marksText: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  answerText: {
    color: colors.success,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 64 },
});
