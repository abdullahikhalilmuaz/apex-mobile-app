import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import { Upload, Trash2, X } from "lucide-react-native";
import Toast from "react-native-toast-message";

const CLASSES = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
];
const SUBJECTS = [
  "English",
  "Mathematics",
  "Basic Science",
  "Social Studies",
  "Civic Education",
  "Computer Studies",
];
const TERMS = ["First", "Second", "Third"];

export default function HeadmasterScheme() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    class: "Primary 5",
    subject: "English",
    term: "First",
    session: "2024/2025",
  });
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const res = await api.get("/schemes");
      setSchemes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Toast.show({ type: "error", text1: "Select a PDF first" });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("pdf", {
        uri: file.uri,
        name: file.name,
        type: "application/pdf",
      } as any);
      fd.append("class", formData.class);
      fd.append("subject", formData.subject);
      fd.append("term", formData.term);
      fd.append("session", formData.session);

      const res = await api.post("/schemes/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      Toast.show({
        type: "success",
        text1: "Scheme uploaded!",
        text2: `${res.data.totalEntries} entries`,
      });
      setFile(null);
      setShowModal(false);
      fetchSchemes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Upload failed",
        text2: error?.response?.data?.error || "Try again",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/schemes/${id}`);
      Toast.show({ type: "success", text1: "Deleted" });
      fetchSchemes();
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed" });
    }
  };

  if (loading)
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </LinearGradient>
    );

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Scheme of Work</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => setShowModal(true)}
          >
            <Upload size={18} color={colors.white} />
            <Text style={styles.uploadText}>Upload PDF</Text>
          </TouchableOpacity>
        </View>

        {schemes.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No schemes yet</Text>
          </GlassCard>
        ) : (
          schemes.map((scheme) => {
            const uniqueWeeks = [
              ...new Set(scheme.weeks.map((w: any) => w.weekNumber)),
            ];
            return (
              <GlassCard key={scheme._id} style={{ marginBottom: spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.schemeTitle}>
                      {scheme.subject} - {scheme.class}
                    </Text>
                    <Text style={styles.schemeMeta}>
                      {scheme.term} Term • {uniqueWeeks.length} weeks •{" "}
                      {scheme.weeks.length} entries
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(scheme._id)}>
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Scheme PDF</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Class</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.class}
                onValueChange={(v) => setFormData({ ...formData, class: v })}
                style={styles.picker}
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
                selectedValue={formData.subject}
                onValueChange={(v) => setFormData({ ...formData, subject: v })}
                style={styles.picker}
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
                selectedValue={formData.term}
                onValueChange={(v) => setFormData({ ...formData, term: v })}
                style={styles.picker}
                dropdownIconColor={colors.white}
              >
                {TERMS.map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Session</Text>
            <TextInput
              style={styles.input}
              value={formData.session}
              onChangeText={(t) => setFormData({ ...formData, session: t })}
              placeholderTextColor={colors.textDim}
            />

            <TouchableOpacity style={styles.fileBtn} onPress={pickPDF}>
              <Text style={styles.fileBtnText}>
                {file ? `📄 ${file.name}` : "📎 Pick PDF File"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, uploading && { opacity: 0.6 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              <Upload size={18} color={colors.white} />
              <Text style={styles.saveBtnText}>
                {uploading ? "AI parsing..." : "Parse & Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  uploadText: { color: colors.white, fontWeight: "600", fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: "center" },
  schemeTitle: { color: colors.white, fontSize: 16, fontWeight: "600" },
  schemeMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
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
    marginBottom: spacing.md,
  },
  fileBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  fileBtnText: { color: colors.white, fontSize: 14 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
});
