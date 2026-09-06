import { useMemo } from "react";

import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/contexts/theme-context";

export default function AppHeader() {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.outlineVariant,
        },
        headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
        avatarContainer: { position: "relative", width: 40, height: 40 },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.primaryContainer,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: theme.primaryFixed,
        },
        avatarText: {
          color: theme.onPrimaryContainer,
          fontSize: 18,
          fontWeight: "700",
        },
        levelBadge: {
          position: "absolute",
          bottom: -4,
          right: -4,
          backgroundColor: theme.secondaryContainer,
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: theme.surface,
        },
        levelText: {
          color: theme.onSecondaryContainer,
          fontSize: 10,
          fontWeight: "700",
        },
        headerTitle: { color: theme.primary, fontSize: 20, fontWeight: "700" },
        notificationButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.surfaceContainerLow,
        },
        notificationIcon: { fontSize: 20 },
      }),
    [theme],
  );

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
            <ThemedText type="small" style={styles.levelText}>
              L3
            </ThemedText>
          </View>
        </View>
        <ThemedText type="title" style={styles.headerTitle}>
          FluentFlow
        </ThemedText>
      </View>
      <View style={styles.notificationButton}>
        <ThemedText style={styles.notificationIcon}>🔔</ThemedText>
      </View>
    </View>
  );
}
