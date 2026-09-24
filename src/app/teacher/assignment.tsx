import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { Plus, BookOpen, X, Trash2 } from "lucide-react-native";
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
  "", // empty = no subject (all subjects)
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

type Assignment = {
  _id: string;
  title: string;
  description: string;
  class: string;
  subject: string;
  topic: string;
  dueDate?: string;
  createdAt: string;
};

export default function TeacherAssignments() {
  const [className, setClassName] = useState("Primary 5");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    topic: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await appApi.get(
        `/assignments/class/${encodeURIComponent(className)}`,
      );
      setAssignments(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load assignments" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [className]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: "error", text1: "Title required" });
      return;
    }
    try {
      await appApi.post("/assignments", { ...form, class: className });
      Toast.show({ type: "success", text1: "Assignment posted" });
      setShowAdd(false);
      setForm({ title: "", description: "", subject: "", topic: "" });
      load();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: err?.response?.data?.error || "Try again",
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete assignment?", "Parents will no longer see this.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await appApi.delete(`/assignments/${id}`);
            Toast.show({ type: "success", text1: "Deleted" });
            load();
          } catch {
            Toast.show({ type: "error", text1: "Failed" });
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Assignments</Text>
            <Text style={styles.subtitle}>Post homework for your class</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

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
        </GlassCard>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : assignments.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No assignments yet.</Text>
          </GlassCard>
        ) : (
          assignments.map((a) => (
            <GlassCard key={a._id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text style={styles.assignmentMeta}>
                    {a.subject ? a.subject : "All subjects"}
                    {a.topic ? ` • Topic: ${a.topic}` : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(a._id)}>
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
              {a.description ? (
                <Text style={styles.assignmentDesc}>{a.description}</Text>
              ) : null}
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Assignment</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
              placeholderTextColor={colors.textDim}
              placeholder="e.g. Read Chapter 3"
            />

            <Text style={styles.label}>Subject</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.subject}
                onValueChange={(v) => setForm({ ...form, subject: v })}
                dropdownIconColor={colors.white}
                style={{ color: colors.white }}
              >
                {SUBJECTS.map((s) => (
                  <Picker.Item
                    key={s || "none"}
                    label={s ? s : "— All subjects —"}
                    value={s}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>
              Topic (helps parent find it in the book)
            </Text>
            <TextInput
              style={styles.input}
              value={form.topic}
              onChangeText={(t) => setForm({ ...form, topic: t })}
              placeholderTextColor={colors.textDim}
              placeholder="e.g. Chapter 3, Page 42"
            />

            <Text style={styles.label}>Description / Instructions</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              multiline
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              placeholderTextColor={colors.textDim}
              placeholder="What should the student do?"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <BookOpen size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Post Assignment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  assignmentTitle: { color: colors.white, fontSize: 16, fontWeight: "700" },
  assignmentMeta: { color: colors.primary, fontSize: 12, marginTop: 4 },
  assignmentDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
