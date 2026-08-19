import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

export default function AppHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <ThemedText type="smallBold" style={styles.avatarText}>
              U
            </ThemedText>
          </View>
          <View style={styles.levelBadge}>
            <ThemedText type="labelSm" style={styles.levelText}>
              L3
            </ThemedText>
          </View>
        </View>
        <ThemedText type="displayMobile" style={styles.headerTitle}>
          FluentFlow
        </ThemedText>
      </View>
      <View style={styles.notificationButton}>
        <ThemedText style={styles.notificationIcon}>🔔</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.primaryFixed,
  },
  avatarText: {
    color: Colors.light.onPrimaryContainer,
    fontSize: 18,
    fontWeight: "700",
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: Colors.light.secondaryContainer,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.surface,
  },
  levelText: {
    color: Colors.light.onSecondaryContainer,
    fontSize: 10,
    fontWeight: "700",
  },
  headerTitle: {
    color: Colors.light.primary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.01,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  notificationIcon: {
    fontSize: 20,
  },
});
