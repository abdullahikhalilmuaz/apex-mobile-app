import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
  Send,
  Search,
  X,
  User,
  Users as UsersIcon,
  ChevronDown,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../../constants/colors";
import api from "../../lib/api";

type Recipient = { id: string; model: string; label: string };
type Message = {
  _id: string;
  senderModel?: string;
  senderId?: { _id: string; name?: string; email?: string };
  childName?: string;
  content: string;
  createdAt: string;
};

export default function HeadmasterMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [receiverId, setReceiverId] = useState("");
  const [receiverModel, setReceiverModel] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const load = async () => {
    try {
      const [messagesRes, recipientsRes] = await Promise.all([
        api.get("/headmaster/messages"),
        api.get("/headmaster/messages/recipients"),
      ]);

      const sorted = [...messagesRes.data].sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(sorted);
      setRecipients(recipientsRes.data);

      if (recipientsRes.data.length > 0 && !receiverId) {
        setReceiverId(recipientsRes.data[0].id);
        setReceiverModel(recipientsRes.data[0].model);
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to load messages" });
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

  const toggleSearch = () => {
    const to = searchOpen ? 0 : 1;
    setSearchOpen(!searchOpen);
    if (searchOpen) setQuery("");
    Animated.timing(searchAnim, {
      toValue: to,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !receiverId) {
      Toast.show({ type: "error", text1: "Pick recipient and type a message" });
      return;
    }
    const content = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      _id: tempId,
      senderModel: "headmaster",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    setSending(true);
    try {
      await api.post("/headmaster/messages", {
        receiverId,
        receiverModel,
        content,
      });
      Toast.show({ type: "success", text1: "Message sent" });
      load();
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      Toast.show({
        type: "error",
        text1: "Failed to send",
        text2: err?.response?.data?.error || "Try again",
      });
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => {
      const name = (m.senderId?.name || m.childName || "").toLowerCase();
      return name.includes(q) || m.content.toLowerCase().includes(q);
    });
  }, [messages, query]);

  const currentRecipient = recipients.find((r) => r.id === receiverId);

  const senderName = (m: Message) => {
    if (m.senderModel === "parent")
      return m.childName || m.senderId?.name || "Parent";
    if (m.senderModel === "teacher") return m.senderId?.name || "Teacher";
    return "You";
  };

  const isMine = (m: Message) => m.senderModel === "headmaster";

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* ── HEADER with animated search ── */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ]}
            pointerEvents={searchOpen ? "none" : "auto"}
          >
            <Text style={styles.title}>Messages</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleSearch}>
              <Search size={20} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.searchBarWrap,
              {
                opacity: searchAnim,
                transform: [
                  {
                    translateX: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={searchOpen ? "auto" : "none"}
          >
            <View style={styles.searchBar}>
              <Search size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search messages..."
                placeholderTextColor={colors.textDim}
                autoFocus={searchOpen}
              />
              <TouchableOpacity onPress={toggleSearch}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* ── RECIPIENT CHIP ── */}
        <TouchableOpacity
          style={styles.recipientChip}
          onPress={() => setShowRecipientPicker(true)}
          activeOpacity={0.85}
        >
          <View style={styles.recipientAvatar}>
            {currentRecipient?.model === "parent" ? (
              <UsersIcon size={14} color={colors.white} />
            ) : (
              <User size={14} color={colors.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientLabel}>To</Text>
            <Text style={styles.recipientName} numberOfLines={1}>
              {currentRecipient?.label || "Select recipient"}
            </Text>
          </View>
          <ChevronDown size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ── CHAT AREA ── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatScroll}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
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
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>
                {query ? "No matches" : "No messages yet"}
              </Text>
            </View>
          ) : (
            filtered.map((m) => {
              const mine = isMine(m);
              return (
                <View
                  key={m._id}
                  style={[styles.bubbleRow, mine && styles.bubbleRowRight]}
                >
                  {!mine && (
                    <View style={styles.bubbleAvatar}>
                      {m.senderModel === "parent" ? (
                        <UsersIcon size={14} color={colors.white} />
                      ) : (
                        <User size={14} color={colors.white} />
                      )}
                    </View>
                  )}
                  <View style={{ maxWidth: "78%" }}>
                    {!mine && (
                      <Text style={styles.bubbleSender}>{senderName(m)}</Text>
                    )}
                    <View
                      style={[
                        styles.bubble,
                        mine ? styles.bubbleMine : styles.bubbleTheirs,
                      ]}
                    >
                      <Text style={styles.bubbleText}>{m.content}</Text>
                    </View>
                    <Text
                      style={[
                        styles.bubbleTime,
                        mine && { textAlign: "right" },
                      ]}
                    >
                      {formatTime(m.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ── BOTTOM INPUT BAR ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!newMessage.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={sending || !newMessage.trim()}
          >
            <Send size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── RECIPIENT PICKER MODAL ── */}
      <Modal
        visible={showRecipientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecipientPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Recipient</Text>
              <TouchableOpacity onPress={() => setShowRecipientPicker(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={recipients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const active = item.id === receiverId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.recipientOption,
                      active && styles.recipientOptionActive,
                    ]}
                    onPress={() => {
                      setReceiverId(item.id);
                      setReceiverModel(item.model);
                      setShowRecipientPicker(false);
                    }}
                  >
                    <View
                      style={[
                        styles.recipientOptionAvatar,
                        active && { backgroundColor: colors.white },
                      ]}
                    >
                      {item.model === "parent" ? (
                        <UsersIcon
                          size={16}
                          color={active ? colors.primary : colors.white}
                        />
                      ) : (
                        <User
                          size={16}
                          color={active ? colors.primary : colors.white}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.recipientOptionText,
                        active && { color: colors.white, fontWeight: "700" },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>No recipients available</Text>
              }
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HEADER */
  header: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    position: "relative",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: colors.white, fontSize: 24, fontWeight: "700" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.xxl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    paddingVertical: 4,
  },

  /* RECIPIENT CHIP */
  recipientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  recipientAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recipientLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  recipientName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 1,
  },

  /* CHAT */
  chatScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 24, // ← reduce from spacing.lg since inputBar now pushes content up
  },
  emptyWrap: { alignItems: "center", paddingTop: 60 },
  empty: { color: colors.textMuted, fontSize: 14 },

  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: spacing.md,
    justifyContent: "flex-start",
  },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleSender: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleTheirs: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: { color: colors.white, fontSize: 14, lineHeight: 19 },
  bubbleTime: {
    color: colors.textFaint,
    fontSize: 10,
    marginTop: 3,
    marginHorizontal: 4,
  },

  /* INPUT */
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 100 : 88, // ← clears floating tab bar
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

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { color: colors.white, fontSize: 20, fontWeight: "700" },
  recipientOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  recipientOptionActive: { backgroundColor: colors.primary },
  recipientOptionAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  recipientOptionText: { color: colors.text, fontSize: 14, flex: 1 },
});
