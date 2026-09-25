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
import { Users, CheckCircle, Clock, MessageCircle } from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { colors, gradients, spacing } from "../../constants/colors";
import StatCard from "../../components/StatCard";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import appApi from "../../lib/appApi";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pupils: 0,
    present: 0,
    absent: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      // 1. Get teacher's class from general backend
      const generalRes = await api
        .get("/dashboard/teacher-stats")
        .catch(() => ({ data: { classAssigned: "", messages: 0 } }));

      const classAssigned = generalRes.data.classAssigned || "";
      const messages = generalRes.data.messages || 0;

      // 2. Get pupil + attendance stats from app-server
      let appData = { pupils: 0, present: 0, absent: 0 };
      if (classAssigned) {
        try {
          const appRes = await appApi.get(
            `/dashboard/teacher-stats?class=${encodeURIComponent(classAssigned)}`,
          );
          appData = appRes.data;
        } catch {}
      }

      setStats({
        pupils: appData.pupils || 0,
        present: appData.present || 0,
        absent: appData.absent || 0,
        messages,
      });
    } catch (err) {
      console.error("Teacher dashboard load error:", err);
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
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.welcome}>Welcome,</Text>
        <Text style={styles.name}>{user?.name} 👋</Text>

        <View style={styles.grid}>
          <StatCard
            icon={<Users size={22} color={colors.white} />}
            label="My Pupils"
            value={stats.pupils}
          />
          <StatCard
            icon={<CheckCircle size={22} color={colors.success} />}
            label="Present"
            value={stats.present}
          />
        </View>
        <View style={styles.grid}>
          <StatCard
            icon={<Clock size={22} color={colors.error} />}
            label="Absent"
            value={stats.absent}
          />
          <StatCard
            icon={<MessageCircle size={22} color={colors.accent} />}
            label="Messages"
            value={stats.messages}
          />
        </View>

        <GlassCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionText}>
            Mark attendance · Enter results · Send message
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
