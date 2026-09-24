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
import { Bell } from "lucide-react-native";

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements/feed");
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </LinearGradient>
    );

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Announcements</Text>
        <Text style={styles.subtitle}>School announcements and updates</Text>

        {announcements.length === 0 ? (
          <GlassCard style={{ padding: 40, alignItems: "center" }}>
            <Bell
              size={48}
              color={colors.textFaint}
              style={{ marginBottom: spacing.md }}
            />
            <Text style={styles.empty}>No announcements yet</Text>
          </GlassCard>
        ) : (
          announcements.map((item) => (
            <GlassCard key={item._id} style={{ marginBottom: spacing.md }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.content}</Text>
              <Text style={styles.itemMeta}>
                {new Date(item.createdAt).toLocaleDateString()} • To:{" "}
                {item.audience}
                {item.createdBy?.name && ` • By: ${item.createdBy.name}`}
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
  empty: { color: colors.textMuted, textAlign: "center" },
});
