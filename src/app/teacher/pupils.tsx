import { useEffect, useState } from "react";
import { Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function HeadmasterPupils() {
  const [pupils, setPupils] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/pupils")
      .then((res) => setPupils(res.data))
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
        <Text style={styles.title}>All Pupils</Text>
        <Text style={styles.subtitle}>{pupils.length} total</Text>
        {pupils.map((p) => (
          <GlassCard key={p._id} style={{ marginBottom: spacing.md }}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.meta}>
              {p.class} · {p.admissionNumber}
            </Text>
          </GlassCard>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  name: { color: colors.white, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
