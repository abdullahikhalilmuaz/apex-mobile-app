import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Users, Plus, Trash2, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
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
};

export default function ParentChildren() {
  const router = useRouter();
  const [myChildren, setMyChildren] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  const loadMine = async () => {
    setLoadingMine(true);
    try {
      const res = await appApi.get("/parent/children");
      setMyChildren(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load children" });
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await appApi.get(
          `/students/search?q=${encodeURIComponent(query.trim())}`,
        );
        const linkedIds = new Set(myChildren.map((c) => c._id));
        setResults(res.data.filter((s: Student) => !linkedIds.has(s._id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [query, myChildren]);

  const handleLink = async (studentId: string) => {
    setLinking(studentId);
    try {
      await appApi.post("/parent/link", { studentId });
      Toast.show({ type: "success", text1: "Child added" });
      setQuery("");
      setResults([]);
      loadMine();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to add",
        text2: err?.response?.data?.error || "Try again",
      });
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (studentId: string) => {
    try {
      await appApi.delete(`/parent/link/${studentId}`);
      Toast.show({ type: "success", text1: "Child removed" });
      loadMine();
    } catch {
      Toast.show({ type: "error", text1: "Failed" });
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>My Children</Text>
        <Text style={styles.subtitle}>Search by name to add your child</Text>

        {/* Search */}
        <GlassCard style={{ marginBottom: spacing.lg }}>
          <View style={styles.searchWrap}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search first, middle, or last name..."
              placeholderTextColor={colors.textDim}
            />
            {searching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {results.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.resultsLabel}>Search results</Text>
              {results.map((s) => (
                <TouchableOpacity
                  key={s._id}
                  style={styles.resultRow}
                  onPress={() => handleLink(s._id)}
                  disabled={linking === s._id}
                >
                  <View style={styles.avatarSmall}>
                    <Users size={16} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>
                      {s.firstName} {s.middleName ? s.middleName + " " : ""}
                      {s.lastName}
                    </Text>
                    <Text style={styles.resultMeta}>{s.class}</Text>
                  </View>
                  {linking === s._id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Plus size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <Text style={styles.noResults}>No matching students found</Text>
          )}
        </GlassCard>

        {/* My children list */}
        <Text style={styles.sectionLabel}>Linked children</Text>
        {loadingMine ? (
          <ActivityIndicator color={colors.primary} />
        ) : myChildren.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>
              No children linked yet. Search above to add.
            </Text>
          </GlassCard>
        ) : (
          myChildren.map((c) => (
            <TouchableOpacity
              key={c._id}
              onPress={() => router.push(`/parent/child/${c._id}` as any)}
              activeOpacity={0.85}
            >
              <GlassCard style={{ marginBottom: spacing.sm }}>
                <View style={styles.childRow}>
                  <View style={styles.avatar}>
                    <Users size={20} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>
                      {c.firstName} {c.middleName ? c.middleName + " " : ""}
                      {c.lastName}
                    </Text>
                    <Text style={styles.childMeta}>{c.class}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleUnlink(c._id);
                    }}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                  <ChevronRight size={18} color={colors.textDim} />
                </View>
              </GlassCard>
            </TouchableOpacity>
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.lg,
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
  resultsLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  resultName: { color: colors.white, fontSize: 14, fontWeight: "600" },
  resultMeta: { color: colors.textMuted, fontSize: 11 },
  noResults: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  empty: { color: colors.textMuted, textAlign: "center" },
  childRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  childName: { color: colors.white, fontSize: 15, fontWeight: "600" },
  childMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
