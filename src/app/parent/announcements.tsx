import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function ParentAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/announcements/feed");
      setItems(res.data);
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
        <Text style={styles.title}>Announcements</Text>
        <Text style={styles.subtitle}>School updates</Text>

        {items.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No announcements yet</Text>
          </GlassCard>
        ) : (
          items.map((a) => (
            <GlassCard key={a._id} style={{ marginBottom: spacing.md }}>
              <Text style={styles.itemTitle}>{a.title}</Text>
              <Text style={styles.itemBody}>{a.content}</Text>
              <Text style={styles.itemMeta}>
                {new Date(a.createdAt).toLocaleDateString()}
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
  itemTitle: { color: colors.white, fontSize: 17, fontWeight: "600" },
  itemBody: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  itemMeta: { color: colors.textFaint, fontSize: 12, marginTop: 10 },
  empty: { color: colors.textMuted, textAlign: "center" },
});
