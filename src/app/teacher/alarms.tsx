import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Plus, Trash2, X, TestTube, Bug } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import {
  ClassAlarm,
  createAlarm,
  deleteAlarm,
  getAlarms,
  toggleAlarm,
  ensureNotificationPermission,
  fireTestNotification,
  DAY_LABELS,
} from "../../lib/alarms";

export default function TeacherAlarms() {
  const router = useRouter();
  const [alarms, setAlarms] = useState<ClassAlarm[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("Class Reminder");
  const [body, setBody] = useState("Class starts in 5 minutes");
  const [hour12, setHour12] = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("PM");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [permissionReason, setPermissionReason] = useState<string>("");
  const [testing, setTesting] = useState(false);

  const load = async () => {
    const list = await getAlarms();
    setAlarms(list);
  };

  const checkPermission = async () => {
    const result = await ensureNotificationPermission();
    setPermissionGranted(result.granted);
    setPermissionReason(result.reason || "");
  };

  useEffect(() => {
    load();
    checkPermission();
  }, []);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await fireTestNotification();
      if (result.ok) {
        Toast.show({
          type: "success",
          text1: "Test sent",
          text2: "You'll get a notification in 10 seconds",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Test failed",
          text2: result.reason || "Try again",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Test failed",
        text2: err?.message || "Try again",
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const get24Hour = (): number => {
    if (ampm === "AM") return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
  };

  const handleCreate = async () => {
    if (days.length === 0) {
      Toast.show({ type: "error", text1: "Pick at least one day" });
      return;
    }
    const hour24 = get24Hour();
    await createAlarm({ title, body, hour: hour24, minute, days });
    Toast.show({ type: "success", text1: "Alarm created" });
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteAlarm(id);
    Toast.show({ type: "success", text1: "Alarm deleted" });
    load();
  };

  const handleToggle = async (id: string) => {
    await toggleAlarm(id);
    load();
  };

  const formatTime = (h: number, m: number) => {
    const ampmStr = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${m.toString().padStart(2, "0")} ${ampmStr}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Class Alarms</Text>
            <Text style={styles.subtitle}>Fire even when app is closed</Text>
          </View>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTest}
            disabled={testing}
          >
            <TestTube size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => router.push("/teacher/alarm-diagnostics" as any)}
          >
            <Bug size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {permissionGranted === false && (
          <GlassCard
            style={{ marginBottom: spacing.md, borderColor: colors.error }}
          >
            <Text
              style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}
            >
              ⚠️ Notifications blocked
            </Text>
            <Text
              style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}
            >
              Reason: {permissionReason || "unknown"}
            </Text>
            <Text
              style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}
            >
              Alarms will not fire. If in Expo Go, install the dev build.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 8,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor: colors.primary,
                borderRadius: radius.md,
              }}
              onPress={checkPermission}
            >
              <Text
                style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}
              >
                Retry Permission
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {alarms.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>No alarms yet. Tap + to add one.</Text>
          </GlassCard>
        ) : (
          alarms.map((alarm) => (
            <GlassCard key={alarm.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.alarmRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alarmTitle}>{alarm.title}</Text>
                  <Text style={styles.alarmTime}>
                    {formatTime(alarm.hour, alarm.minute)}
                  </Text>
                  <Text style={styles.alarmDays}>
                    {alarm.days.map((d) => DAY_LABELS[d]).join(", ")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 8 }}>
                  <Switch
                    value={alarm.enabled}
                    onValueChange={() => handleToggle(alarm.id)}
                    trackColor={{
                      false: "rgba(255,255,255,0.15)",
                      true: colors.primary,
                    }}
                    thumbColor={colors.white}
                  />
                  <TouchableOpacity onPress={() => handleDelete(alarm.id)}>
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Alarm</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.input}
              value={body}
              onChangeText={setBody}
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.label}>Time</Text>
            <View style={styles.timeRow}>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={hour12}
                  onValueChange={(v) => setHour12(v)}
                  style={styles.picker}
                  dropdownIconColor={colors.white}
                >
                  {hours.map((h) => (
                    <Picker.Item key={h} label={String(h)} value={h} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.colon}>:</Text>

              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={minute}
                  onValueChange={(v) => setMinute(v)}
                  style={styles.picker}
                  dropdownIconColor={colors.white}
                >
                  {minutes.map((m) => (
                    <Picker.Item
                      key={m}
                      label={m.toString().padStart(2, "0")}
                      value={m}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.ampmBox}>
                <TouchableOpacity
                  style={[
                    styles.ampmBtn,
                    ampm === "AM" && styles.ampmBtnActive,
                  ]}
                  onPress={() => setAmpm("AM")}
                >
                  <Text
                    style={[
                      styles.ampmText,
                      ampm === "AM" && styles.ampmTextActive,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.ampmBtn,
                    ampm === "PM" && styles.ampmBtnActive,
                  ]}
                  onPress={() => setAmpm("PM")}
                >
                  <Text
                    style={[
                      styles.ampmText,
                      ampm === "PM" && styles.ampmTextActive,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Repeat on</Text>
            <View style={styles.daysRow}>
              {DAY_LABELS.map((label, idx) => {
                const active = days.includes(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => toggleDay(idx)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        active && styles.dayChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <Bell size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Create Alarm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  testBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { color: colors.textMuted, textAlign: "center" },
  alarmRow: { flexDirection: "row", alignItems: "center" },
  alarmTitle: { color: colors.white, fontSize: 16, fontWeight: "600" },
  alarmTime: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  alarmDays: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: "700" },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  picker: { color: colors.white },
  colon: { color: colors.white, fontSize: 24, fontWeight: "700" },
  ampmBox: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    padding: 4,
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  ampmBtnActive: { backgroundColor: colors.primary },
  ampmText: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
  ampmTextActive: { color: colors.white },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.lg,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  dayChipTextActive: { color: colors.white },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
