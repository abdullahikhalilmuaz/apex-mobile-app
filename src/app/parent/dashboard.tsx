import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
  Users,
  CheckCircle,
  Clock,
  Bell,
  MessageCircle,
} from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { colors, gradients, spacing } from "../../constants/colors";
import StatCard from "../../components/StatCard";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import appApi from "../../lib/appApi";

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
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    // 1. Children from app-server (parent links)
    let children: any[] = [];
    try {
      const res = await appApi.get("/parent/children");
      children = res.data || [];
    } catch {}

    // 2. Attendance + avg score — average across children
    let totalAttendancePercent = 0;
    let totalAvgScore = 0;
    let childrenWithAttendance = 0;
    let childrenWithScore = 0;

    for (const child of children) {
      // Attendance
      try {
        const attRes = await appApi.get(`/attendance/student/${child._id}`);
        const summary = attRes.data?.summary;
        if (summary && summary.total > 0) {
          const pct = Math.round((summary.present / summary.total) * 100);
          totalAttendancePercent += pct;
          childrenWithAttendance++;
        }
      } catch {}

      // Latest result average (try First Term of current session)
      try {
        const resRes = await appApi.get(
          `/results/student/${child._id}?term=First&session=${encodeURIComponent(
            "2026/2027",
          )}`,
        );
        if (resRes.data?.average != null) {
          totalAvgScore += resRes.data.average;
          childrenWithScore++;
        }
      } catch {}
    }

    const attendance =
      childrenWithAttendance > 0
        ? Math.round(totalAttendancePercent / childrenWithAttendance)
        : 0;

    const averageScore =
      childrenWithScore > 0
        ? Math.round((totalAvgScore / childrenWithScore) * 10) / 10
        : 0;

    // 3. General backend: parent stats (messages + announcements)
    let messages = 0;
    let announcements = 0;
    try {
      const genRes = await api.get("/parents/stats");
      messages = genRes.data?.messages || 0;
      announcements = genRes.data?.announcements || 0;
    } catch {}

    setStats({
      children: children.length,
      averageScore,
      attendance,
      announcements,
      messages,
    });
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await load();
        setLoading(false);
      })();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
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
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
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
