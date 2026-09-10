import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";
import { colors, gradients, spacing } from "../../constants/colors";
import { Users, UserCheck, BookOpen, Bell } from "lucide-react-native";
import StatCard from "../../components/StatCard";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function HeadmasterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPupils: 0,
    totalTeachers: 0,
    presentToday: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
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
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name} 👋</Text>

        <View style={styles.grid}>
          <StatCard
            icon={<Users size={22} color={colors.white} />}
            label="Total Pupils"
            value={stats.totalPupils}
          />
          <StatCard
            icon={<BookOpen size={22} color={colors.info} />}
            label="Teachers"
            value={stats.totalTeachers}
          />
        </View>
        <View style={styles.grid}>
          <StatCard
            icon={<UserCheck size={22} color={colors.success} />}
            label="Present Today"
            value={stats.presentToday}
          />
          <StatCard
            icon={<Bell size={22} color={colors.warning} />}
            label="Announcements"
            value={stats.announcements}
          />
        </View>

        <GlassCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionText}>
            Manage pupils · Post announcements · Send messages
          </Text>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  welcome: { color: colors.textMuted, fontSize: 15 },
  name: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  grid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  sectionText: { color: colors.textMuted, fontSize: 14 },
});
