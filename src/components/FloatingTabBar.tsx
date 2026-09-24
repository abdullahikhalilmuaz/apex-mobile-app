import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, gradients, radius, spacing } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";

// Visible tabs PER ROLE — no cross-contamination
const TABS_BY_ROLE: Record<string, string[]> = {
  teacher: ["dashboard", "pupils", "attendance", "results", "more"],
  headmaster: ["dashboard", "pupils", "announcements", "results", "messages"],
  parent: ["dashboard", "children", "announcements", "messages"],
};

function TabButton({
  isActive,
  onPress,
  icon,
}: {
  isActive: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 15 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
      activeOpacity={0.8}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabInner, animatedStyle]}>
        {isActive ? (
          <LinearGradient
            colors={gradients.main}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activePill}
          >
            {icon}
          </LinearGradient>
        ) : (
          <View style={styles.inactivePill}>{icon}</View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { user } = useAuth();
  const role = user?.role ?? "parent";

  const allowedTabs = TABS_BY_ROLE[role] || [];

  const visibleRoutes = state.routes.filter((route) =>
    allowedTabs.includes(route.name),
  );

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.container}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index].key === route.key;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? colors.white : colors.textDim,
            size: 22,
          });

          return (
            <TabButton
              key={route.key}
              isActive={isFocused}
              onPress={onPress}
              icon={icon}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingHorizontal: spacing.md,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,20,40,0.95)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: "100%",
    maxWidth: 480,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
  },
  tabInner: { alignItems: "center", justifyContent: "center" },
  activePill: {
    width: 52,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  inactivePill: {
    width: 52,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
