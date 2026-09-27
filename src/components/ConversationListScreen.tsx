import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Plus,
  User,
  Users as UsersIcon,
  MessageCircle,
  X,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, gradients, spacing, radius } from "../constants/colors";
import GlassCard from "./GlassCard";
import { messagingApi } from "../lib/messagingApi";
import { useAuth } from "../hooks/useAuth";

type Conversation = {
  _id: string;
  type: "direct" | "group";
  name: string;
  participantRole?: string;
  lastMessage: string;
  lastMessageAt?: string;
  lastMessageSenderName?: string;
};

type Recipient = { id: string; role: string; name: string; label: string };

export default function ConversationListScreen({
  title = "Messages",
  subtitle = "Chat with your school",
  routePrefix,
}: {
  title?: string;
  subtitle?: string;
  routePrefix: string; // e.g. "teacher", "parent", "headmaster"
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const load = async () => {
    try {
      // Sync current user first (so others can find them)
      await messagingApi.syncMe(user?.name, user?.email).catch(() => {});

      const [convsRes, recipRes] = await Promise.all([
        messagingApi.getConversations(),
        messagingApi.getRecipients(),
      ]);
      setConversations(convsRes.data || []);
      setRecipients(recipRes.data || []);
    } catch (err) {
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

  const openChat = (id: string) => {
    router.push(`/${routePrefix}/chat/${id}` as any);
  };

  const startDirect = async (toUserId: string) => {
    try {
      const res = await messagingApi.startDirect(toUserId);
      setShowPicker(false);
      openChat(res.data._id);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Could not start chat",
        text2: err?.response?.data?.error || "Try again",
      });
    }
  };

  const iconFor = (c: Conversation) => {
    if (c.type === "group") return <UsersIcon size={20} color={colors.white} />;
    return <User size={20} color={colors.white} />;
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowPicker(true)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : conversations.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyWrap}>
              <MessageCircle size={28} color={colors.textMuted} />
              <Text style={styles.empty}>No conversations yet</Text>
              <Text style={styles.emptyHint}>Tap + to start a chat</Text>
            </View>
          </GlassCard>
        ) : (
          conversations.map((c) => (
            <TouchableOpacity
              key={c._id}
              onPress={() => openChat(c._id)}
              activeOpacity={0.85}
            >
              <GlassCard style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.avatar,
                      c.type === "group" && { backgroundColor: colors.accent },
                    ]}
                  >
                    {iconFor(c)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={styles.time}>
                        {timeAgo(c.lastMessageAt)}
                      </Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={1}>
                      {c.lastMessageSenderName
                        ? `${c.lastMessageSenderName}: `
                        : ""}
                      {c.lastMessage || "No messages yet"}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Recipient picker */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={recipients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recipientOption}
                  onPress={() => startDirect(item.id)}
                >
                  <View style={styles.recipientAvatar}>
                    {item.role === "parent" ? (
                      <UsersIcon size={16} color={colors.white} />
                    ) : (
                      <User size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.recipientText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No contacts available</Text>
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
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 26, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: { alignItems: "center", paddingVertical: spacing.lg },
  empty: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  emptyHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { color: colors.white, fontSize: 15, fontWeight: "700", flex: 1 },
  time: { color: colors.textFaint, fontSize: 11, marginLeft: 6 },
  preview: { color: colors.textMuted, fontSize: 12.5, marginTop: 3 },
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
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  recipientAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recipientText: { color: colors.white, fontSize: 14, flex: 1 },
});
