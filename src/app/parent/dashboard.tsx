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
import { colors, gradients, spacing, radius } from "../../constants/colors";
import {
  Users,
  CheckCircle,
  Clock,
  Bell,
  MessageCircle,
} from "lucide-react-native";
import StatCard from "../../components/StatCard";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    children: 0,
    averageScore: 0,
    attendance: 0,
    announcements: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [childrenRes, statsRes] = await Promise.all([
        api.get("/parent/children"),
        api.get("/parent/stats"),
      ]);
      setStats({
        children: childrenRes.data.length,
        averageScore: statsRes.data.averageScore || 0,
        attendance: statsRes.data.attendance || 0,
        announcements: statsRes.data.announcements || 0,
        messages: statsRes.data.messages || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name} 👋</Text>

        <View style={styles.grid}>
          <StatCard
            icon={<Users size={22} color={colors.white} />}
            label="Children"
            value={stats.children}
          />
          <StatCard
            icon={<CheckCircle size={22} color={colors.success} />}
            label="Avg Score"
            value={`${stats.averageScore}%`}
          />
        </View>

        <View style={styles.grid}>
          <StatCard
            icon={<Clock size={22} color={colors.info} />}
            label="Attendance"
            value={`${stats.attendance}%`}
          />
          <StatCard
            icon={<Bell size={22} color={colors.warning} />}
            label="News"
            value={stats.announcements}
          />
        </View>

        <View style={styles.grid}>
          <StatCard
            icon={<MessageCircle size={22} color={colors.accent} />}
            label="Messages"
            value={stats.messages}
          />
        </View>

        <GlassCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionText}>
            View children · Check results · Message headmaster
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
