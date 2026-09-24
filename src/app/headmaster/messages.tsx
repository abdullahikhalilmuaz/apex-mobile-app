import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import api from "../../lib/api";
import { Send } from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function HeadmasterMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get("/headmaster/messages");
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </LinearGradient>
    );

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{messages.length} total</Text>

        {messages.map((m) => (
          <GlassCard key={m._id} style={{ marginBottom: spacing.md }}>
            <Text style={styles.sender}>
              {m.senderModel === "parent" ? "👨‍👩‍👧 Parent of: " : "👨‍🏫 Teacher: "}
              {m.childName || m.senderId?.name || "Unknown"}
            </Text>
            <Text style={styles.msgContent}>{m.content}</Text>
            <Text style={styles.msgMeta}>
              {new Date(m.createdAt).toLocaleString()}
            </Text>
          </GlassCard>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  sender: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  msgContent: { color: colors.white, fontSize: 15 },
  msgMeta: { color: colors.textFaint, fontSize: 12, marginTop: 6 },
});
