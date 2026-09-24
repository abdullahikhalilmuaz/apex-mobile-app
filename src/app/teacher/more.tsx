import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import GlassCard from "../../components/GlassCard";
import {
  BookOpen,
  FileText,
  Bell,
  MessageCircle,
  LogOut,
  ChevronRight,
  AlarmClock,
  Users,
  ClipboardList,
} from "lucide-react-native";

export default function TeacherMore() {
  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    {
      icon: Users,
      label: "Students",
      subtitle: "Manage class roster",
      route: "/teacher/students",
    },
    {
      icon: ClipboardList,
      label: "Assignments",
      subtitle: "Post homework to class",
      route: "/teacher/assignments",
    },
    {
      icon: BookOpen,
      label: "Scheme of Work",
      subtitle: "View curriculum progress",
      route: "/teacher/scheme",
    },
    {
      icon: FileText,
      label: "Lesson Notes",
      subtitle: "Create and manage notes",
      route: "/teacher/lessons",
    },
    {
      icon: Bell,
      label: "Announcements",
      subtitle: "School updates",
      route: "/teacher/announcements",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      subtitle: "Chat with headmaster",
      route: "/teacher/message",
    },
    {
      icon: AlarmClock,
      label: "Class Alarms",
      subtitle: "Schedule class reminders",
      route: "/teacher/alarms",
    },
  ];

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Additional tools and settings</Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(item.route as any)}
            style={styles.itemWrap}
          >
            <GlassCard style={styles.item}>
              <View style={styles.itemLeft}>
                <View style={styles.iconWrap}>
                  <item.icon size={22} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textDim} />
            </GlassCard>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={logout} style={styles.itemWrap}>
          <GlassCard style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconWrap, styles.logoutIcon]}>
                <LogOut size={22} color={colors.error} />
              </View>
              <View>
                <Text style={[styles.itemLabel, { color: colors.error }]}>
                  Logout
                </Text>
                <Text style={styles.itemSubtitle}>
                  Sign out of your account
                </Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
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
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  itemWrap: { marginBottom: spacing.md },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: { backgroundColor: colors.errorBg },
  itemLabel: { color: colors.white, fontSize: 16, fontWeight: "600" },
  itemSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
