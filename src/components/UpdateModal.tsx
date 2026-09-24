import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Download, X, Sparkles } from "lucide-react-native";
import { colors, gradients, spacing, radius } from "../constants/colors";
import { VersionInfo } from "../lib/appVersion";

type Props = {
  visible: boolean;
  force: boolean;
  info: VersionInfo | null;
  onDismiss: () => void;
};

export default function UpdateModal({
  visible,
  force,
  info,
  onDismiss,
}: Props) {
  if (!info) return null;

  const handleDownload = () => {
    if (info.downloadUrl) {
      Linking.openURL(info.downloadUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={force ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!force && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onDismiss}
              hitSlop={12}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.iconWrap}>
            <LinearGradient colors={gradients.main} style={styles.iconBg}>
              <Sparkles size={28} color={colors.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>
            {force ? "Update Required" : "Update Available"}
          </Text>

          <Text style={styles.version}>v{info.latestVersion}</Text>

          {info.releaseNotes ? (
            <Text style={styles.notes}>{info.releaseNotes}</Text>
          ) : null}

          {force && (
            <Text style={styles.forceNote}>
              This version is no longer supported. Please update to continue
              using the app.
            </Text>
          )}

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradients.main}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.downloadGradient}
            >
              <Download size={20} color={colors.white} />
              <Text style={styles.downloadText}>Download Update</Text>
            </LinearGradient>
          </TouchableOpacity>

          {!force && (
            <TouchableOpacity onPress={onDismiss} style={styles.laterBtn}>
              <Text style={styles.laterText}>Maybe later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1a1830",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    padding: 4,
    zIndex: 10,
  },
  iconWrap: {
    marginBottom: spacing.md,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  version: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  notes: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  forceNote: {
    color: colors.warning,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  downloadBtn: {
    width: "100%",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  downloadGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  downloadText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  laterBtn: {
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  laterText: {
    color: colors.textDim,
    fontSize: 13,
  },
});
