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
import { Plus, Users, X, Trash2 } from "lucide-react-native";
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

type Student = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  class: string;
  gender?: string;
  admissionNumber?: string;
};

export default function TeacherPupils() {
  const [className, setClassName] = useState("Primary 5");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "male",
    guardianName: "",
    guardianPhone: "",
  });

  const loadStudents = async () => {
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
    loadStudents();
  }, [className]);

  const handleAdd = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Toast.show({ type: "error", text1: "First and last name required" });
      return;
    }
    try {
      await appApi.post("/students", { ...form, class: className });
      Toast.show({ type: "success", text1: "Student added" });
      setShowAdd(false);
      setForm({
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "male",
        guardianName: "",
        guardianPhone: "",
      });
      loadStudents();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Add failed",
        text2: err?.response?.data?.error || "Try again",
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete student?", "This will hide the student.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await appApi.delete(`/students/${id}`);
            Toast.show({ type: "success", text1: "Student removed" });
            loadStudents();
          } catch {
            Toast.show({ type: "error", text1: "Delete failed" });
          }
        },
      },
    ]);
  };

  const filtered = students.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const full =
      `${s.firstName} ${s.middleName || ""} ${s.lastName}`.toLowerCase();
    return (
      full.includes(q) || (s.admissionNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pupils</Text>
            <Text style={styles.subtitle}>Manage your class roster</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Class selector */}
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

        {/* Search */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or admission no..."
            placeholderTextColor={colors.textDim}
          />
        </GlassCard>

        <Text style={styles.countText}>
          {filtered.length} student{filtered.length === 1 ? "" : "s"} in{" "}
          {className}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>
              {query ? "No matches" : "No students yet. Tap + to add one."}
            </Text>
          </GlassCard>
        ) : (
          filtered.map((s) => (
            <GlassCard key={s._id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Users size={20} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>
                    {s.firstName} {s.middleName ? s.middleName + " " : ""}
                    {s.lastName}
                  </Text>
                  <Text style={styles.studentMeta}>
                    {s.admissionNumber || "—"} · {s.gender || "—"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(s._id)}>
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Add modal */}
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Student</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>First name *</Text>
            <TextInput
              style={styles.input}
              value={form.firstName}
              onChangeText={(t) => setForm({ ...form, firstName: t })}
              placeholderTextColor={colors.textDim}
              placeholder="e.g. Ahmed"
            />

            <Text style={styles.label}>Middle name (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.middleName}
              onChangeText={(t) => setForm({ ...form, middleName: t })}
              placeholderTextColor={colors.textDim}
              placeholder="e.g. Musa"
            />

            <Text style={styles.label}>Last name *</Text>
            <TextInput
              style={styles.input}
              value={form.lastName}
              onChangeText={(t) => setForm({ ...form, lastName: t })}
              placeholderTextColor={colors.textDim}
              placeholder="e.g. Ibrahim"
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v })}
                dropdownIconColor={colors.white}
                style={{ color: colors.white }}
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>

            <Text style={styles.label}>Guardian name (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.guardianName}
              onChangeText={(t) => setForm({ ...form, guardianName: t })}
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.label}>Guardian phone (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={form.guardianPhone}
              onChangeText={(t) => setForm({ ...form, guardianPhone: t })}
              placeholderTextColor={colors.textDim}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Plus size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Add Student</Text>
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
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  empty: { color: colors.textMuted, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  studentName: { color: colors.white, fontSize: 15, fontWeight: "600" },
  studentMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
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
    maxHeight: "90%",
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
