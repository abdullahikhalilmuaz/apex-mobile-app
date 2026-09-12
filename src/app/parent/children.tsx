import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function ParentChildren() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await api.get("/parent/children");
      setChildren(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const linkChild = async () => {
    if (!admissionNumber.trim()) {
      setError("Please enter an admission number");
      return;
    }
    setLinking(true);
    setError("");
    try {
      await api.post("/parent/link-child", { admissionNumber });
      setShowModal(false);
      setAdmissionNumber("");
      fetchChildren();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to link child");
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My Children</Text>
            <Text style={styles.subtitle}>View your linked children</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={22} color={colors.white} />
            <Text style={styles.addButtonText}>Link Child</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No children linked yet</Text>
            <TouchableOpacity
              style={[styles.addButton, { alignSelf: "center", marginTop: 12 }]}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Link Your Child</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          children.map((child) => (
            <TouchableOpacity
              key={child._id}
              activeOpacity={0.7}
              onPress={() => router.push(`/parent/children/${child._id}`)}
            >
              <GlassCard style={{ marginBottom: spacing.md }}>
                <View style={styles.childRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childMeta}>
                      {child.class} · {child.admissionNumber}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={colors.textMuted}
                  />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Link Your Child</Text>
            <Text style={styles.modalSubtitle}>
              Enter your child's admission number
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Admission Number"
              placeholderTextColor={colors.textMuted}
              value={admissionNumber}
              onChangeText={setAdmissionNumber}
              editable={!linking}
              autoCapitalize="none"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.modalButton, linking && { opacity: 0.6 }]}
              onPress={linkChild}
              disabled={linking}
            >
              <Text style={styles.modalButtonText}>
                {linking ? "Linking..." : "Link Child"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowModal(false);
                setError("");
                setAdmissionNumber("");
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  addButtonText: { color: colors.white, fontWeight: "600", fontSize: 14 },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childName: { color: colors.white, fontSize: 18, fontWeight: "600" },
  childMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: "center" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(30,25,60,0.98)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  modalTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: spacing.sm,
  },
  error: { color: "#f87171", fontSize: 13, marginBottom: spacing.sm },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  modalButtonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelButton: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
  cancelText: { color: colors.textMuted, fontSize: 14 },
});
