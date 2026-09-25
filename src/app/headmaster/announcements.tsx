import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Bell,
  Send,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "teachers", label: "Teachers" },
  { value: "parents", label: "Parents" },
  { value: "pupils", label: "Pupils" },
];

type Announcement = {
  _id: string;
  title: string;
  content: string;
  audience: string;
  createdAt: string;
};

export default function HeadmasterAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    audience: "all",
  });

  const load = async () => {
    try {
      const res = await api.get("/announcements");
      // Sort newest first
      const sorted = [...res.data].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(sorted);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load announcements" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", content: "", audience: "all" });
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a._id);
    setForm({
      title: a.title,
      content: a.content,
      audience: a.audience || "all",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Toast.show({ type: "error", text1: "Title and content required" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, form);
        Toast.show({ type: "success", text1: "Announcement updated" });
      } else {
        await api.post("/announcements", form);
        Toast.show({ type: "success", text1: "Announcement sent" });
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to save",
        text2: err?.response?.data?.error || "Try again",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete announcement?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/announcements/${id}`);
            Toast.show({ type: "success", text1: "Deleted" });
            load();
          } catch {
            Toast.show({ type: "error", text1: "Failed to delete" });
          }
        },
      },
    ]);
  };

  const audienceLabel = (v: string) =>
    AUDIENCES.find((a) => a.value === v)?.label || v || "Everyone";

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
            <Text style={styles.title}>Announcements</Text>
            <Text style={styles.subtitle}>
              {items.length} total · pull down to refresh
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : items.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyWrap}>
              <Bell size={32} color={colors.textMuted} />
              <Text style={styles.empty}>No announcements yet</Text>
              <Text style={styles.emptyHint}>Tap + to create one</Text>
            </View>
          </GlassCard>
        ) : (
          items.map((a) => (
            <GlassCard key={a._id} style={{ marginBottom: spacing.md }}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemTitle}>{a.title}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => openEdit(a)}
                    style={styles.iconBtn}
                  >
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(a._id)}
                    style={styles.iconBtn}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.itemBody}>{a.content}</Text>

              <View style={styles.metaRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    To: {audienceLabel(a.audience)}
                  </Text>
                </View>
                <Text style={styles.itemMeta}>
                  {new Date(a.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Announcement" : "New Announcement"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
              placeholder="e.g. Mid-term break"
              placeholderTextColor={colors.textDim}
              maxLength={100}
            />

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, { minHeight: 120 }]}
              multiline
              value={form.content}
              onChangeText={(t) => setForm({ ...form, content: t })}
              placeholder="Write the announcement message..."
              placeholderTextColor={colors.textDim}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Audience</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.audience}
                onValueChange={(v) => setForm({ ...form, audience: v })}
                dropdownIconColor={colors.white}
                style={{ color: colors.white }}
              >
                {AUDIENCES.map((a) => (
                  <Picker.Item key={a.value} label={a.label} value={a.value} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Send size={18} color={colors.white} />
              <Text style={styles.saveBtnText}>
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Announcement"
                  : "Send Announcement"}
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
  emptyWrap: { alignItems: "center", paddingVertical: spacing.lg },
  empty: { color: colors.white, fontSize: 15, fontWeight: "600", marginTop: spacing.sm },
  emptyHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  itemTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  actions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    color: colors.textMuted,
    fontSize: 13.5,
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: "rgba(102,126,234,0.2)",
    borderWidth: 1,
    borderColor: "rgba(102,126,234,0.4)",
  },
  tagText: { color: colors.accent, fontSize: 11, fontWeight: "600" },
  itemMeta: { color: colors.textFaint, fontSize: 11 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
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
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
  },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
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