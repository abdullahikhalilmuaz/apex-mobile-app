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
import { Users, UserCheck, BookOpen, Bell } from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { colors, gradients, spacing } from "../../constants/colors";
import StatCard from "../../components/StatCard";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import appApi from "../../lib/appApi";

export default function HeadmasterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPupils: 0,
    totalTeachers: 0,
    presentToday: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      // Fetch from app-server (pupils + attendance)
      const appStatsPromise = appApi
        .get("/dashboard/stats")
        .catch(() => ({ data: { totalPupils: 0, presentToday: 0 } }));

      // Fetch from general backend (teachers + announcements)
      const generalStatsPromise = api
        .get("/dashboard/stats")
        .catch(() => ({ data: { totalTeachers: 0, announcements: 0 } }));

      const [appRes, genRes] = await Promise.all([
        appStatsPromise,
        generalStatsPromise,
      ]);

      setStats({
        totalPupils: appRes.data.totalPupils || 0,
        totalTeachers: genRes.data.totalTeachers || 0,
        presentToday: appRes.data.presentToday || 0,
        announcements: genRes.data.announcements || 0,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
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
            colors={[colors.primary]}
          />
        }
      >
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
