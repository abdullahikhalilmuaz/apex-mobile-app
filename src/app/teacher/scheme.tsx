import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import { CheckCircle, Circle } from "lucide-react-native";
import Toast from "react-native-toast-message";

const CLASSES = ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
const SUBJECTS = ["English", "Mathematics", "Basic Science", "Social Studies", "Civic Education", "Computer Studies"];

export default function TeacherScheme() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("Primary 1");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, [selectedClass]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/schemes/class/${selectedClass}`);
      setSchemes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = async (schemeId: string, weekNumber: number) => {
    try {
      await api.put(`/schemes/${schemeId}/week`, { weekNumber });
      fetchSchemes();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to update",
        text2: error?.response?.data?.error || "Try again",
      });
    }
  };

  const currentScheme = schemes.find((s) => s.subject === selectedSubject);

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Scheme of Work</Text>
        <Text style={styles.subtitle}>Track your curriculum progress</Text>

        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedClass}
              onValueChange={setSelectedClass}
              style={styles.picker}
              dropdownIconColor={colors.white}
            >
              {CLASSES.map((c) => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>

          <Text style={styles.label}>Subject</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedSubject}
              onValueChange={setSelectedSubject}
              style={styles.picker}
              dropdownIconColor={colors.white}
            >
              {SUBJECTS.map((s) => <Picker.Item key={s} label={s} value={s} />)}
            </Picker>
          </View>
        </GlassCard>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !currentScheme ? (
          <GlassCard>
            <Text style={styles.empty}>No scheme found for {selectedSubject}</Text>
          </GlassCard>
        ) : (
          <>
            <Text style={styles.progress}>
              {currentScheme.weeks.filter((w: any) => w.completed).length} /{" "}
              {currentScheme.weeks.length} weeks completed
            </Text>

            {currentScheme.weeks.map((week: any) => (
              <TouchableOpacity
                key={week.weekNumber}
                onPress={() => toggleWeek(currentScheme._id, week.weekNumber)}
              >
                <GlassCard style={styles.weekRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weekTitle}>
                      Week {week.weekNumber}: {week.topic}
                    </Text>
                    {week.subtopics?.length > 0 && (
                      <Text style={styles.weekSub}>
                        {week.subtopics.join(" • ")}
                      </Text>
                    )}
                  </View>
                  {week.completed ? (
                    <CheckCircle size={24} color={colors.success} />
                  ) : (
                    <Circle size={24} color={colors.textFaint} />
                  )}
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  pickerWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  picker: { color: colors.white },
  progress: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.md },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  weekTitle: { color: colors.white, fontSize: 15, fontWeight: "600" },
  weekSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: "center" },
});