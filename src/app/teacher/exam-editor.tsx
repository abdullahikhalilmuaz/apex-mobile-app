import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2, Send, Save } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import appApi from "../../lib/appApi";
import {
  ExamData,
  saveDraft,
  loadDraft,
  clearDraft,
  addPending,
} from "../../lib/examDraft";

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

type Section = "objectives" | "essays" | "fillBlanks";

export default function ExamEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [data, setData] = useState<ExamData>({
    title: "",
    class: "Primary 5",
    subject: "Mathematics",
    term: "First",
    session: "2026/2027",
    duration: "2 hours",
    totalMarks: 100,
    instructions: "",
    objectives: [],
    essays: [],
    fillBlanks: [],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [expanded, setExpanded] = useState<Section>("objectives");

  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing exam
  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await appApi.get(`/exams/${id}`);
      const e = res.data;
      setData({
        title: e.title || "",
        class: e.class,
        subject: e.subject,
        term: e.term,
        session: e.session,
        duration: e.duration || "2 hours",
        totalMarks: e.totalMarks || 100,
        instructions: e.instructions || "",
        objectives: e.objectives || [],
        essays: e.essays || [],
        fillBlanks: e.fillBlanks || [],
      });
      setIsExisting(true);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load exam" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Load local draft (if exists)
  useEffect(() => {
    (async () => {
      if (id) return;
      const draft = await loadDraft(
        data.class,
        data.subject,
        data.term,
        data.session,
      );
      if (draft) {
        setData(draft);
        Toast.show({ type: "info", text1: "Draft restored" });
      }
    })();
  }, [data.class, data.subject, data.term, data.session]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(data);
    }, 800);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [data]);

  const update = (patch: Partial<ExamData>) => setData({ ...data, ...patch });

  // ── Objectives ──
  const addObjective = () => {
    update({
      objectives: [
        ...data.objectives,
        {
          number: data.objectives.length + 1,
          text: "",
          options: ["", "", "", ""],
          correct: "",
        },
      ],
    });
  };
  const updateObjective = (i: number, patch: any) => {
    const arr = [...data.objectives];
    arr[i] = { ...arr[i], ...patch };
    update({ objectives: arr });
  };
  const removeObjective = (i: number) => {
    const arr = data.objectives.filter((_, idx) => idx !== i);
    arr.forEach((o, idx) => (o.number = idx + 1));
    update({ objectives: arr });
  };
  const updateOption = (i: number, optIdx: number, val: string) => {
    const arr = [...data.objectives];
    const opts = [...(arr[i].options || ["", "", "", ""])];
    opts[optIdx] = val;
    arr[i] = { ...arr[i], options: opts };
    update({ objectives: arr });
  };

  // ── Essays ──
  const addEssay = () => {
    update({
      essays: [
        ...data.essays,
        { number: data.essays.length + 1, text: "", marks: 5 },
      ],
    });
  };
  const updateEssay = (i: number, patch: any) => {
    const arr = [...data.essays];
    arr[i] = { ...arr[i], ...patch };
    update({ essays: arr });
  };
  const removeEssay = (i: number) => {
    const arr = data.essays.filter((_, idx) => idx !== i);
    arr.forEach((o, idx) => (o.number = idx + 1));
    update({ essays: arr });
  };

  // ── Fill blanks ──
  const addBlank = () => {
    update({
      fillBlanks: [
        ...data.fillBlanks,
        { number: data.fillBlanks.length + 1, text: "", answer: "" },
      ],
    });
  };
  const updateBlank = (i: number, patch: any) => {
    const arr = [...data.fillBlanks];
    arr[i] = { ...arr[i], ...patch };
    update({ fillBlanks: arr });
  };
  const removeBlank = (i: number) => {
    const arr = data.fillBlanks.filter((_, idx) => idx !== i);
    arr.forEach((o, idx) => (o.number = idx + 1));
    update({ fillBlanks: arr });
  };

  // ── Save ──
  const handleSave = async (submit: boolean) => {
    if (!data.subject || !data.class || !data.term || !data.session) {
      Toast.show({
        type: "error",
        text1: "Fill class, subject, term, session",
      });
      return;
    }
    setSaving(true);
    try {
      await appApi.post("/exams", { ...data, submit });
      await clearDraft(data.class, data.subject, data.term, data.session);
      setIsExisting(true);
      Toast.show({
        type: "success",
        text1: submit ? "Submitted for review" : "Saved",
      });
      if (submit) router.back();
    } catch (err: any) {
      const isNetwork = !err?.response || err?.code === "ECONNABORTED";
      if (isNetwork) {
        await addPending({
          id: `${data.class}_${data.subject}_${data.term}_${data.session}_${Date.now()}`,
          data,
          submit,
          createdAt: Date.now(),
        });
        Toast.show({
          type: "success",
          text1: "Saved offline",
          text2: "Will sync when online",
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

  const handleDelete = () => {
    if (!id) return;
    Alert.alert("Delete exam?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await appApi.delete(`/exams/${id}`);
            Toast.show({ type: "success", text1: "Deleted" });
            router.back();
          } catch {
            Toast.show({ type: "error", text1: "Failed" });
          }
        },
      },
    ]);
  };

  const sectionHeader = (key: Section, label: string, count: number) => (
    <TouchableOpacity
      onPress={() => setExpanded(expanded === key ? "objectives" : key)}
      style={[
        styles.sectionHeader,
        expanded === key && styles.sectionHeaderActive,
      ]}
    >
      <Text style={styles.sectionHeaderText}>
        {label} ({count})
      </Text>
      <Text style={styles.sectionHeaderToggle}>
        {expanded === key ? "−" : "+"}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
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
          <Text style={styles.topTitle}>
            {isExisting ? "Edit Exam" : "New Exam"}
          </Text>
          {isExisting ? (
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>

        {/* Exam header fields */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={data.class}
              onValueChange={(v) => update({ class: v })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.white}
            >
              {CLASSES.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Subject</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={data.subject}
              onValueChange={(v) => update({ subject: v })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.white}
            >
              {SUBJECTS.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Term</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={data.term}
              onValueChange={(v) => update({ term: v })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.white}
            >
              {TERMS.map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Session</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={data.session}
              onValueChange={(v) => update({ session: v })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.white}
            >
              {SESSIONS.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Duration</Text>
          <TextInput
            style={styles.input}
            value={data.duration}
            onChangeText={(t) => update({ duration: t })}
            placeholder="e.g. 2 hours"
            placeholderTextColor={colors.textDim}
          />

          <Text style={styles.label}>Total Marks</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(data.totalMarks)}
            onChangeText={(t) =>
              update({ totalMarks: parseInt(t || "0") || 0 })
            }
            placeholder="100"
            placeholderTextColor={colors.textDim}
          />

          <Text style={styles.label}>Instructions (optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            multiline
            value={data.instructions}
            onChangeText={(t) => update({ instructions: t })}
            placeholder="e.g. Answer all questions in Section A"
            placeholderTextColor={colors.textDim}
          />
        </GlassCard>

        {/* OBJECTIVES */}
        {sectionHeader(
          "objectives",
          "SECTION A · OBJECTIVE",
          data.objectives.length,
        )}
        {expanded === "objectives" && (
          <View style={{ marginBottom: spacing.md }}>
            {data.objectives.map((o, i) => (
              <GlassCard key={i} style={{ marginBottom: spacing.sm }}>
                <View style={styles.qHeader}>
                  <Text style={styles.qNum}>Q{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeObjective(i)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={o.text}
                  onChangeText={(t) => updateObjective(i, { text: t })}
                  placeholder="Question text"
                  placeholderTextColor={colors.textDim}
                  multiline
                />
                {["A", "B", "C", "D"].map((letter, idx) => (
                  <View key={letter} style={styles.optionRow}>
                    <Text style={styles.optionLabel}>{letter}.</Text>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={o.options?.[idx] || ""}
                      onChangeText={(t) => updateOption(i, idx, t)}
                      placeholder={`Option ${letter}`}
                      placeholderTextColor={colors.textDim}
                    />
                    <TouchableOpacity
                      style={[
                        styles.correctBtn,
                        o.correct === letter && styles.correctBtnActive,
                      ]}
                      onPress={() => updateObjective(i, { correct: letter })}
                    >
                      <Text
                        style={[
                          styles.correctBtnText,
                          o.correct === letter && { color: colors.white },
                        ]}
                      >
                        ✓
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </GlassCard>
            ))}
            <TouchableOpacity style={styles.addRow} onPress={addObjective}>
              <Plus size={18} color={colors.white} />
              <Text style={styles.addRowText}>Add Objective Question</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ESSAYS */}
        {sectionHeader("essays", "SECTION B · ESSAY", data.essays.length)}
        {expanded === "essays" && (
          <View style={{ marginBottom: spacing.md }}>
            {data.essays.map((e, i) => (
              <GlassCard key={i} style={{ marginBottom: spacing.sm }}>
                <View style={styles.qHeader}>
                  <Text style={styles.qNum}>Q{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeEssay(i)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  value={e.text}
                  onChangeText={(t) => updateEssay(i, { text: t })}
                  placeholder="Essay question"
                  placeholderTextColor={colors.textDim}
                  multiline
                />
                <Text style={styles.label}>Marks</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(e.marks)}
                  onChangeText={(t) =>
                    updateEssay(i, { marks: parseInt(t || "0") || 0 })
                  }
                  placeholder="5"
                  placeholderTextColor={colors.textDim}
                />
              </GlassCard>
            ))}
            <TouchableOpacity style={styles.addRow} onPress={addEssay}>
              <Plus size={18} color={colors.white} />
              <Text style={styles.addRowText}>Add Essay Question</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FILL BLANKS */}
        {sectionHeader(
          "fillBlanks",
          "SECTION C · FILL IN THE BLANK",
          data.fillBlanks.length,
        )}
        {expanded === "fillBlanks" && (
          <View style={{ marginBottom: spacing.lg }}>
            {data.fillBlanks.map((fb, i) => (
              <GlassCard key={i} style={{ marginBottom: spacing.sm }}>
                <View style={styles.qHeader}>
                  <Text style={styles.qNum}>Q{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeBlank(i)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 50 }]}
                  value={fb.text}
                  onChangeText={(t) => updateBlank(i, { text: t })}
                  placeholder="The capital of Nigeria is ___"
                  placeholderTextColor={colors.textDim}
                  multiline
                />
                <Text style={styles.label}>Answer</Text>
                <TextInput
                  style={styles.input}
                  value={fb.answer}
                  onChangeText={(t) => updateBlank(i, { answer: t })}
                  placeholder="Abuja"
                  placeholderTextColor={colors.textDim}
                />
              </GlassCard>
            ))}
            <TouchableOpacity style={styles.addRow} onPress={addBlank}>
              <Plus size={18} color={colors.white} />
              <Text style={styles.addRowText}>Add Fill-in-the-Blank</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { flex: 1, backgroundColor: colors.glassBg },
            ]}
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            <Save size={18} color={colors.white} />
            <Text style={styles.actionBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1 }]}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            <Send size={18} color={colors.white} />
            <Text style={styles.actionBtnText}>
              {saving ? "Submitting..." : "Submit for Review"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 160 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backBtn: { padding: 6 },
  topTitle: { color: colors.white, fontSize: 20, fontWeight: "700" },
  iconBtn: { padding: 6 },
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
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 13,
  },
  sectionHeader: {
    backgroundColor: "#0b2545",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeaderActive: { backgroundColor: colors.primary },
  sectionHeaderText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionHeaderToggle: { color: colors.white, fontSize: 20, fontWeight: "700" },
  qHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  qNum: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  optionLabel: {
    color: colors.white,
    width: 18,
    fontSize: 13,
    fontWeight: "700",
  },
  correctBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  correctBtnActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  correctBtnText: { color: colors.textDim, fontSize: 16, fontWeight: "700" },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
  },
  addRowText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  actionBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
