import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react-native";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import { getNotifEnv, ENV_LABEL } from "../../lib/notificationEnv";
import {
  ensureNotificationPermission,
  listScheduledNotifications,
  cancelAllAlarms,
} from "../../lib/alarms";
import { getLogs, clearLogs, NotifLog } from "../../lib/notificationLogger";

export default function AlarmDiagnostics() {
  const router = useRouter();
  const [env, setEnv] = useState("");
  const [perm, setPerm] = useState<any>({});
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setEnv(ENV_LABEL[getNotifEnv()]);
    const p = await ensureNotificationPermission();
    setPerm(p);
    const s = await listScheduledNotifications();
    setScheduled(s || []);
    const l = await getLogs();
    setLogs(l);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, []),
  );

  const fmtTime = (ts: number) => new Date(ts).toLocaleString("en-GB");

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Alarm Diagnostics</Text>
        <Text style={styles.subtitle}>Live state of notifications</Text>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>Environment</Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Running in: </Text>
            <Text style={styles.value}>{env}</Text>
          </Text>
        </GlassCard>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>Permission</Text>
          <Text style={styles.row}>
            <Text style={styles.label}>Status: </Text>
            <Text
              style={[
                styles.value,
                { color: perm.granted ? colors.success : colors.error },
              ]}
            >
              {perm.granted ? "GRANTED" : perm.reason || "not granted"}
            </Text>
          </Text>
        </GlassCard>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>
            Scheduled Notifications ({scheduled.length})
          </Text>
          {scheduled.length === 0 ? (
            <Text style={styles.muted}>None scheduled</Text>
          ) : (
            scheduled.map((s: any) => (
              <View key={s.identifier} style={styles.notifRow}>
                <Text style={styles.notifTitle}>
                  {s.content?.title || "(no title)"}
                </Text>
                <Text style={styles.notifMeta}>
                  ID: {s.identifier.substring(0, 12)}...
                </Text>
                <Text style={styles.notifMeta}>
                  Trigger: {JSON.stringify(s.trigger)}
                </Text>
              </View>
            ))
          )}
        </GlassCard>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Event Log ({logs.length})</Text>
            <TouchableOpacity
              onPress={async () => {
                await clearLogs();
                refresh();
              }}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.muted}>No events logged</Text>
          ) : (
            logs.slice(0, 30).map((l, i) => (
              <View key={i} style={styles.logRow}>
                <Text style={styles.logTime}>{fmtTime(l.ts)}</Text>
                <Text
                  style={[
                    styles.logType,
                    {
                      color: l.type === "error" ? colors.error : colors.success,
                    },
                  ]}
                >
                  {l.type}
                </Text>
                <Text style={styles.logData} numberOfLines={3}>
                  {JSON.stringify(l.data)}
                </Text>
              </View>
            ))
          )}
        </GlassCard>

        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.error }]}
          onPress={async () => {
            await cancelAllAlarms();
            refresh();
          }}
        >
          <Trash2 size={18} color={colors.white} />
          <Text style={styles.actionText}>
            Clear ALL scheduled notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.action,
            { backgroundColor: colors.primary, marginTop: spacing.sm },
          ]}
          onPress={refresh}
        >
          <RefreshCw size={18} color={colors.white} />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  backText: { color: colors.white, fontSize: 14 },
  title: { color: colors.white, fontSize: 24, fontWeight: "700" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { color: colors.white, fontSize: 13, fontWeight: "600", flex: 1 },
  muted: { color: colors.textMuted, fontSize: 12, fontStyle: "italic" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  notifRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  notifTitle: { color: colors.white, fontSize: 13, fontWeight: "600" },
  notifMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  logRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  logTime: { color: colors.textFaint, fontSize: 10 },
  logType: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  logData: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  actionText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
