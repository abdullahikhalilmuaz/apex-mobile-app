import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function ParentChildren() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await api.get("/parent/children");
      setChildren(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>My Children</Text>
        <Text style={styles.subtitle}>View your linked children</Text>

        {children.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No children linked yet</Text>
          </GlassCard>
        ) : (
          children.map((child) => (
            <GlassCard key={child._id} style={{ marginBottom: spacing.md }}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childMeta}>
                {child.class} · {child.admissionNumber}
              </Text>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  childName: { color: colors.white, fontSize: 18, fontWeight: "600" },
  childMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: "center" },
});
