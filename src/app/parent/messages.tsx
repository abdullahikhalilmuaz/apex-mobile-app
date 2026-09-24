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

export default function ParentMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get("/parent/messages");
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await api.post("/parent/messages", { content: newMessage });
      Toast.show({ type: "success", text1: "Message sent!" });
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to send" });
    } finally {
      setSending(false);
    }
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with the headmaster</Text>

        <GlassCard style={{ marginBottom: spacing.lg }}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textDim}
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              style={styles.sendBtn}
            >
              <Send size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {messages.map((m) => (
          <GlassCard key={m._id} style={{ marginBottom: spacing.md }}>
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
  inputRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    color: colors.white,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  msgContent: { color: colors.white, fontSize: 15 },
  msgMeta: { color: colors.textFaint, fontSize: 12, marginTop: 6 },
});
