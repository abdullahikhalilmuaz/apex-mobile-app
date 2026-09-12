import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Plus, Edit2, Trash2, Save, X, FileText } from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const SUBJECTS = [
  "English",
  "Mathematics",
  "Basic Science",
  "Social Studies",
  "Civic Education",
  "Computer Studies",
];

export default function TeacherLessons() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewNote, setViewNote] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [teacherClass, setTeacherClass] = useState("");
  const [formData, setFormData] = useState({
    subject: "Mathematics",
    topic: "",
    objectives: "",
    teachingMaterials: "",
    introduction: "",
    presentation: "",
    evaluation: "",
    assignment: "",
  });

  useEffect(() => {
    fetchTeacherAndNotes();
  }, []);

  const fetchTeacherAndNotes = async () => {
    try {
      const [teacherRes, notesRes] = await Promise.all([
        api.get("/teacher/profile"),
        api.get("/lesson-notes"),
      ]);
      setTeacherClass(teacherRes.data.classAssigned || "");
      setNotes(notesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get("/lesson-notes");
      setNotes(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: "Mathematics",
      topic: "",
      objectives: "",
      teachingMaterials: "",
      introduction: "",
      presentation: "",
      evaluation: "",
      assignment: "",
    });
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!formData.topic.trim()) {
      Toast.show({ type: "error", text1: "Topic is required" });
      return;
    }

    try {
      const data = {
        ...formData,
        objectives: formData.objectives.split("\n").filter(Boolean),
        teachingMaterials: formData.teachingMaterials
          .split("\n")
          .filter(Boolean),
      };

      if (editing) {
        await api.put(`/lesson-notes/${editing}`, data);
        Toast.show({ type: "success", text1: "Note updated" });
      } else {
        await api.post("/lesson-notes", data);
        Toast.show({ type: "success", text1: "Note created" });
      }

      fetchNotes();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: error?.response?.data?.error || "Try again",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/lesson-notes/${id}`);
      Toast.show({ type: "success", text1: "Note deleted" });
      fetchNotes();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to delete" });
    }
  };

  const generatePDF = async (note: any) => {
    try {
      const html = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica; padding: 30px; color: #1a1a1a; }
          h1 { font-size: 22px; margin-bottom: 20px; }
          h3 { font-size: 14px; margin-top: 16px; margin-bottom: 4px; color: #4a4a4a; }
          p { font-size: 13px; line-height: 1.6; margin: 4px 0; }
          ul { padding-left: 20px; margin: 4px 0; }
          hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>${note.topic}</h1>
        <hr />
        <h3>Subject</h3><p>${note.subject}</p>
        <h3>Class</h3><p>${note.class}</p>
        <h3>Date</h3><p>${new Date(note.date).toLocaleDateString()}</p>
        <hr />
        <h3>Objectives</h3>
        <ul>${(note.objectives || []).map((o: string) => `<li>${o}</li>`).join("")}</ul>
        <h3>Teaching Materials</h3>
        <ul>${(note.teachingMaterials || []).map((m: string) => `<li>${m}</li>`).join("")}</ul>
        <h3>Introduction</h3><p>${note.introduction || ""}</p>
        <h3>Presentation</h3><p>${note.presentation || ""}</p>
        <h3>Evaluation</h3><p>${note.evaluation || ""}</p>
        <h3>Assignment</h3><p>${note.assignment || ""}</p>
      </body>
    </html>
    `;

      // On Android, use printAsync (opens native save/print dialog)
      if (Platform.OS === "android") {
        await Print.printAsync({ html });
      } else {
        // iOS
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Save ${note.topic}`,
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error: any) {
      if (error.message !== "Printing did not complete") {
        Toast.show({
          type: "error",
          text1: "PDF failed",
          text2: error.message,
        });
      }
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Lesson Notes</Text>
            <Text style={styles.subtitle}>
              {notes.length} notes {teacherClass && `• ${teacherClass}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={18} color={colors.white} />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : notes.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No lesson notes yet</Text>
          </GlassCard>
        ) : (
          notes.map((note) => (
            <TouchableOpacity key={note._id} onPress={() => setViewNote(note)}>
              <GlassCard style={{ marginBottom: spacing.md }}>
                <Text style={styles.noteTitle}>{note.topic}</Text>
                <Text style={styles.noteMeta}>
                  {note.class} • {note.subject} •{" "}
                  {new Date(note.date).toLocaleDateString()}
                </Text>
                {note.introduction && (
                  <Text style={styles.notePreview} numberOfLines={2}>
                    {note.introduction}
                  </Text>
                )}
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setEditing(note._id);
                      setFormData({
                        subject: note.subject,
                        topic: note.topic,
                        objectives: note.objectives?.join("\n") || "",
                        teachingMaterials:
                          note.teachingMaterials?.join("\n") || "",
                        introduction: note.introduction || "",
                        presentation: note.presentation || "",
                        evaluation: note.evaluation || "",
                        assignment: note.assignment || "",
                      });
                      setShowModal(true);
                    }}
                  >
                    <Edit2 size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      generatePDF(note);
                    }}
                  >
                    <FileText size={18} color={colors.info} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(note._id);
                    }}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!viewNote} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{viewNote?.topic}</Text>
              <TouchableOpacity onPress={() => setViewNote(null)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.detailMeta}>
                {viewNote?.class} • {viewNote?.subject} •{" "}
                {viewNote?.date
                  ? new Date(viewNote.date).toLocaleDateString()
                  : ""}
              </Text>

              {viewNote?.objectives?.length > 0 && (
                <>
                  <Text style={styles.detailLabel}>Objectives</Text>
                  {viewNote.objectives.map((o: string, i: number) => (
                    <Text key={i} style={styles.detailItem}>
                      • {o}
                    </Text>
                  ))}
                </>
              )}

              {viewNote?.teachingMaterials?.length > 0 && (
                <>
                  <Text style={styles.detailLabel}>Teaching Materials</Text>
                  {viewNote.teachingMaterials.map((m: string, i: number) => (
                    <Text key={i} style={styles.detailItem}>
                      • {m}
                    </Text>
                  ))}
                </>
              )}

              {viewNote?.introduction && (
                <>
                  <Text style={styles.detailLabel}>Introduction</Text>
                  <Text style={styles.detailItem}>{viewNote.introduction}</Text>
                </>
              )}

              {viewNote?.presentation && (
                <>
                  <Text style={styles.detailLabel}>Presentation</Text>
                  <Text style={styles.detailItem}>{viewNote.presentation}</Text>
                </>
              )}

              {viewNote?.evaluation && (
                <>
                  <Text style={styles.detailLabel}>Evaluation</Text>
                  <Text style={styles.detailItem}>{viewNote.evaluation}</Text>
                </>
              )}

              {viewNote?.assignment && (
                <>
                  <Text style={styles.detailLabel}>Assignment</Text>
                  <Text style={styles.detailItem}>{viewNote.assignment}</Text>
                </>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  const note = viewNote;
                  setViewNote(null);
                  setTimeout(() => generatePDF(note), 300);
                }}
              >
                <FileText size={18} color={colors.white} />
                <Text style={styles.saveBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit/Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? "Edit Note" : "New Note"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.classBanner}>
              <Text style={styles.classBannerText}>
                Class: {teacherClass || "Not assigned"}
              </Text>
            </View>

            <ScrollView>
              <Text style={styles.label}>Subject</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={formData.subject}
                  onValueChange={(v) =>
                    setFormData({ ...formData, subject: v })
                  }
                  style={styles.picker}
                  dropdownIconColor={colors.white}
                >
                  {SUBJECTS.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Topic"
                placeholderTextColor={colors.textDim}
                value={formData.topic}
                onChangeText={(t) => setFormData({ ...formData, topic: t })}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Objectives (one per line)"
                placeholderTextColor={colors.textDim}
                multiline
                value={formData.objectives}
                onChangeText={(t) =>
                  setFormData({ ...formData, objectives: t })
                }
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Teaching Materials (one per line)"
                placeholderTextColor={colors.textDim}
                multiline
                value={formData.teachingMaterials}
                onChangeText={(t) =>
                  setFormData({ ...formData, teachingMaterials: t })
                }
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Introduction"
                placeholderTextColor={colors.textDim}
                multiline
                value={formData.introduction}
                onChangeText={(t) =>
                  setFormData({ ...formData, introduction: t })
                }
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Presentation"
                placeholderTextColor={colors.textDim}
                multiline
                value={formData.presentation}
                onChangeText={(t) =>
                  setFormData({ ...formData, presentation: t })
                }
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Evaluation"
                placeholderTextColor={colors.textDim}
                multiline
                value={formData.evaluation}
                onChangeText={(t) =>
                  setFormData({ ...formData, evaluation: t })
                }
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Assignment"
                placeholderTextColor={colors.textDim}
                multiline
                value={formData.assignment}
                onChangeText={(t) =>
                  setFormData({ ...formData, assignment: t })
                }
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                <Save size={18} color={colors.white} />
                <Text style={styles.saveBtnText}>
                  {editing ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  newBtnText: { color: colors.white, fontWeight: "600", fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: "center" },
  noteTitle: { color: colors.white, fontSize: 16, fontWeight: "600" },
  noteMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  notePreview: { color: colors.textDim, fontSize: 13, marginTop: 8 },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
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
  classBanner: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  classBannerText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  picker: { color: colors.white },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  detailMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  detailLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: 4,
  },
  detailItem: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
});
