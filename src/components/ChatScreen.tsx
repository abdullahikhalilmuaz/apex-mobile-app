import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { messagingApi } from "../lib/messagingApi";

type Message = {
  _id: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  createdAt: string;
};

export default function ChatScreen({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const load = async () => {
    try {
      const res = await messagingApi.getMessages(conversationId);
      setMessages(res.data || []);
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: false }),
        100,
      );
    } catch {
      Toast.show({ type: "error", text1: "Failed to load chat" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [conversationId]);

  // ─── Socket listeners ───
  useEffect(() => {
    if (!socket) {
      console.log("[chat] no socket yet");
      return;
    }

    console.log("[chat] listening on socket for conv", conversationId);

    const onNewMessage = (msg: any) => {
      console.log("[chat] new-message event received:", msg._id);
      if (String(msg.conversationId) !== String(conversationId)) {
        console.log(
          "[chat] ignored — different conv",
          msg.conversationId,
          "vs",
          conversationId,
        );
        return;
      }

      setMessages((prev) => {
        const withoutTemp = prev.filter(
          (m) =>
            !(
              m._id.startsWith("temp-") &&
              m.content === msg.content &&
              String(m.senderId) === String(msg.senderId)
            ),
        );
        if (withoutTemp.some((m) => m._id === msg._id)) return withoutTemp;
        return [...withoutTemp, msg];
      });

      // If the other person sends a message, clear their typing indicator
      if (String(msg.senderId) !== String(user?.id)) {
        setTypingUsers((prev) =>
          prev.filter((n) => n !== (msg.senderName || "")),
        );
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const onTyping = (payload: any) => {
      if (String(payload.conversationId) !== String(conversationId)) return;
      if (String(payload.userId) === String(user?.id)) return;

      const name = payload.userName || "Someone";
      if (payload.isTyping) {
        setTypingUsers((prev) =>
          prev.includes(name) ? prev : [...prev, name],
        );
      } else {
        setTypingUsers((prev) => prev.filter((n) => n !== name));
      }
    };

    socket.on("new-message", onNewMessage);
    socket.on("typing", onTyping);
    socket.emit("join-conversation", conversationId);
    console.log("[chat] joined conversation:", conversationId);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("typing", onTyping);
      socket.emit("leave-conversation", conversationId);
    };
  }, [socket, conversationId, user?.id]);

  // ─── Emit typing events on text change (debounced) ───
  const emitTyping = (typing: boolean) => {
    if (!socket) return;
    isTypingRef.current = typing;
    socket.emit("typing", { conversationId, isTyping: typing });
  };

  const handleTextChange = (t: string) => {
    setText(t);

    if (!isTypingRef.current && t.trim().length > 0) {
      emitTyping(true);
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    if (t.trim().length === 0) {
      if (isTypingRef.current) emitTyping(false);
      return;
    }

    // Auto-stop typing after 2.5s of inactivity
    typingTimeout.current = setTimeout(() => {
      if (isTypingRef.current) emitTyping(false);
    }, 2500);
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    if (isTypingRef.current) emitTyping(false);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      _id: tempId,
      senderId: user?.id || "",
      senderName: user?.name || "",
      senderRole: user?.role || "",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    setSending(true);
    try {
      const res = await messagingApi.send(conversationId, content);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? res.data : m)));
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setText(content);
      Toast.show({
        type: "error",
        text1: "Failed to send",
        text2: err?.response?.data?.error || "Try again",
      });
    } finally {
      setSending(false);
    }
  };

  const isMine = (m: Message) => String(m.senderId) === String(user?.id);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const typingLabel =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0]} is typing…`
        : `${typingUsers.slice(0, 2).join(", ")} are typing…`;

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Chat</Text>
            {typingLabel ? (
              <Text style={styles.typingLabel}>{typingLabel}</Text>
            ) : null}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <Text style={styles.empty}>No messages yet — say hello 👋</Text>
            ) : (
              messages.map((m) => {
                const mine = isMine(m);
                return (
                  <View
                    key={m._id}
                    style={[styles.bubbleRow, mine && styles.bubbleRowRight]}
                  >
                    <View style={{ maxWidth: "78%" }}>
                      {!mine && m.senderName ? (
                        <Text style={styles.sender}>{m.senderName}</Text>
                      ) : null}
                      <View
                        style={[
                          styles.bubble,
                          mine ? styles.bubbleMine : styles.bubbleTheirs,
                        ]}
                      >
                        <Text style={styles.bubbleText}>{m.content}</Text>
                      </View>
                      <Text
                        style={[styles.time, mine && { textAlign: "right" }]}
                      >
                        {fmtTime(m.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={sending || !text.trim()}
          >
            <Send size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: "700" },
  typingLabel: {
    color: colors.accent,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 2,
  },
  chatScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 60,
    fontSize: 14,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
    justifyContent: "flex-start",
  },
  bubbleRowRight: { justifyContent: "flex-end" },
  sender: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  bubbleTheirs: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 4,
  },
  bubbleMine: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  bubbleText: { color: colors.white, fontSize: 14, lineHeight: 19 },
  time: {
    color: colors.textFaint,
    fontSize: 10,
    marginTop: 3,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 100 : 88,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: "rgba(15,12,41,0.95)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
