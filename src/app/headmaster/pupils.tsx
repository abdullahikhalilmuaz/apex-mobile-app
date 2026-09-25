import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Users } from "lucide-react-native";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import appApi from "../../lib/appApi";

type Student = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  class: string;
  gender?: string;
  admissionNumber?: string;
};

export default function HeadmasterPupils() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await appApi.get("/students/all");
      setStudents(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const full =
        `${s.firstName} ${s.middleName || ""} ${s.lastName}`.toLowerCase();
      return (
        full.includes(q) || (s.admissionNumber || "").toLowerCase().includes(q)
      );
    });
  }, [students, query]);

  const grouped = useMemo(() => {
    const map: Record<string, Student[]> = {};
    filtered.forEach((s) => {
      if (!map[s.class]) map[s.class] = [];
      map[s.class].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totalCount = students.length;
  const shownCount = filtered.length;

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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>All Pupils</Text>
            <Text style={styles.subtitle}>
              {shownCount === totalCount
                ? `${totalCount} student${totalCount === 1 ? "" : "s"} in school`
                : `${shownCount} of ${totalCount} students`}
            </Text>
          </View>
          <View style={styles.iconWrap}>
            <Users size={22} color={colors.white} />
          </View>
        </View>

        {/* Search */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <View style={styles.searchWrap}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or admission no..."
              placeholderTextColor={colors.textDim}
            />
          </View>
        </GlassCard>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>
              {query ? "No matches found" : "No students yet"}
            </Text>
          </GlassCard>
        ) : (
          grouped.map(([className, list]) => (
            <View key={className} style={{ marginBottom: spacing.lg }}>
              <Text style={styles.classHeader}>
                {className} · {list.length}
              </Text>
              {list.map((s) => (
                <GlassCard key={s._id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.row}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {s.firstName[0]}
                        {s.lastName[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>
                        {s.firstName}
                        {s.middleName ? " " + s.middleName : ""} {s.lastName}
                      </Text>
                      <Text style={styles.meta}>
                        {s.admissionNumber || "—"} · {s.gender ? s.gender : "—"}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 14 },
  empty: { color: colors.textMuted, textAlign: "center" },
  classHeader: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  name: { color: colors.white, fontSize: 15, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
