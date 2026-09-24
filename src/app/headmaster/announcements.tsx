import { useEffect, useState } from "react";
import { Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function HeadmasterAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/announcements")
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </LinearGradient>
    );

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Announcements</Text>
        <Text style={styles.subtitle}>{items.length} total</Text>

        {items.map((a) => (
          <GlassCard key={a._id} style={{ marginBottom: spacing.md }}>
            <Text style={styles.itemTitle}>{a.title}</Text>
            <Text style={styles.itemBody}>{a.content}</Text>
            <Text style={styles.itemMeta}>
              {new Date(a.createdAt).toLocaleDateString()} · To: {a.audience}
            </Text>
          </GlassCard>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  itemTitle: { color: colors.white, fontSize: 17, fontWeight: "600" },
  itemBody: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  itemMeta: { color: colors.textFaint, fontSize: 12, marginTop: 10 },
});
