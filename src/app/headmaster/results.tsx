import { useEffect, useState } from "react";
import { Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function HeadmasterResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/results/headmaster/class?class=Primary 1")
      .then((res) => setResults(res.data))
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
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>{results.length} entries</Text>

        {results.map((r) => (
          <GlassCard key={r._id} style={{ marginBottom: spacing.md }}>
            <Text style={styles.name}>{r.pupilId?.name || "Unknown"}</Text>
            <Text style={styles.meta}>
              {r.subject} · {r.total} · Grade {r.grade}
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
  name: { color: colors.white, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
