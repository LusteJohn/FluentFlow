import { BackHandler, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import AlertDialog from "@/components/alert-dialog";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

interface StatCard {
  id: string;
  value: string;
  label: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

interface WeeklyBar {
  day: string;
  height: number;
}

interface RecentExercise {
  id: string;
  type: string;
  typeIcon: any;
  typeIconBg: string;
  typeIconColor: string;
  title: string;
  status: "Completed" | "In Progress";
  statusIcon: any;
  statusColor: string;
  xp: string;
  xpColor: string;
}

const STAT_CARDS: StatCard[] = [
  {
    id: "1",
    value: "7",
    label: "Day Streak",
    icon: { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" },
    iconBg: Colors.light.surface,
    iconColor: Colors.light.tertiary,
  },
  {
    id: "2",
    value: "245",
    label: "Words",
    icon: { ios: "book.fill", android: "menu_book", web: "menu_book" },
    iconBg: Colors.light.surface,
    iconColor: Colors.light.primary,
  },
  {
    id: "3",
    value: "1.2k",
    label: "Total XP",
    icon: { ios: "star.fill", android: "stars", web: "stars" },
    iconBg: Colors.light.surface,
    iconColor: Colors.light.secondary,
  },
];

const WEEKLY_BARS: WeeklyBar[] = [
  { day: "M", height: 40 },
  { day: "T", height: 60 },
  { day: "W", height: 30 },
  { day: "T", height: 80 },
  { day: "F", height: 50 },
  { day: "S", height: 0 },
  { day: "S", height: 0 },
];

const RECENT_EXERCISES: RecentExercise[] = [
  {
    id: "1",
    type: "sentence_builder",
    typeIcon: { ios: "puzzlepiece.fill", android: "construction", web: "construction" },
    typeIconBg: Colors.light.tertiaryContainer,
    typeIconColor: Colors.light.onTertiary,
    title: "Sentence Builder",
    status: "Completed",
    statusIcon: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
    statusColor: Colors.light.primary,
    xp: "+20 XP",
    xpColor: Colors.light.primary,
  },
  {
    id: "2",
    type: "listening",
    typeIcon: { ios: "ear.fill", android: "hearing", web: "hearing" },
    typeIconBg: Colors.light.primaryContainer,
    typeIconColor: Colors.light.onPrimaryContainer,
    title: "Listening Comp.",
    status: "Completed",
    statusIcon: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
    statusColor: Colors.light.primary,
    xp: "+15 XP",
    xpColor: Colors.light.primary,
  },
  {
    id: "3",
    type: "vocab_drill",
    typeIcon: { ios: "text.book.closed.fill", android: "translate", web: "translate" },
    typeIconBg: Colors.light.surfaceContainer,
    typeIconColor: Colors.light.onSurfaceVariant,
    title: "Vocab Drill",
    status: "In Progress",
    statusIcon: { ios: "circle.dashed", android: "pending", web: "pending" },
    statusColor: Colors.light.onSurfaceVariant,
    xp: "-- XP",
    xpColor: Colors.light.onSurfaceVariant,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExit = () => {
    setShowExitDialog(false);
    if (Platform.OS === "android") {
      BackHandler.exitApp();
    } else {
      router.back();
    }
  };

  const handleCancel = () => {
    setShowExitDialog(false);
  };

  const handleBackPress = () => {
    setShowExitDialog(true);
    return true;
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress,
      );
      return () => subscription.remove();
    }
  }, []);

  const renderStatCard = (card: StatCard) => (
    <View
      key={card.id}
      style={[
        styles.statCard,
        { backgroundColor: card.iconBg },
      ]}>
      <View style={styles.statCardInner}>
        <View
          style={[
            styles.statIconContainer,
            { backgroundColor: "#ffffff30" },
          ]}>
          <SymbolView
            name={card.icon}
            size={28}
            tintColor={card.iconColor}
          />
        </View>
        <ThemedText style={styles.statValue}>{card.value}</ThemedText>
        <ThemedText style={styles.statLabel}>{card.label}</ThemedText>
      </View>
      <View
        style={[
          styles.statHoverOverlay,
          { backgroundColor: "#ffffff20" },
        ]}
      />
    </View>
  );

  const renderWeeklyBar = (item: WeeklyBar, index: number) => (
    <View key={item.day} style={styles.weekBarContainer}>
      <View style={styles.weekBarTrack}>
        <View
          style={[
            styles.weekBarFill,
            {
              height: Math.max(item.height, 4),
              backgroundColor:
                index === 4
                  ? Colors.light.primary
                  : Colors.light.primaryContainer,
            },
          ]}
        />
      </View>
      <ThemedText
        style={[
          styles.weekBarLabel,
          index === 4 && styles.weekBarLabelActive,
        ]}>
        {item.day}
      </ThemedText>
    </View>
  );

  const renderRecentExercise = (item: RecentExercise) => (
    <View key={item.id} style={styles.exerciseItem}>
      <View style={styles.exerciseItemLeft}>
        <View
          style={[
            styles.exerciseIconContainer,
            {
              backgroundColor: `${item.typeIconBg}20`,
            },
          ]}>
          <SymbolView
            name={item.typeIcon}
            size={20}
            tintColor={item.typeIconColor}
          />
        </View>
        <View style={styles.exerciseItemInfo}>
          <ThemedText style={styles.exerciseTitle}>{item.title}</ThemedText>
          <View style={styles.exerciseStatusRow}>
            <SymbolView
              name={item.statusIcon}
              size={14}
              tintColor={item.statusColor}
            />
            <ThemedText
              style={[
                styles.exerciseStatusText,
                { color: item.statusColor },
              ]}>
              {item.status}
            </ThemedText>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.exerciseXpChip,
          {
            backgroundColor:
              item.xpColor === Colors.light.primary
                ? Colors.light.primaryContainer
                : Colors.light.surfaceContainer,
          },
        ]}>
        <ThemedText
          style={[
            styles.exerciseXpText,
            { color: item.xpColor },
          ]}>
          {item.xp}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Your Stats</ThemedText>
          <View style={styles.statGrid}>
            <View style={styles.statGridRow}>
              {STAT_CARDS.slice(0, 2).map(renderStatCard)}
            </View>
            <View style={styles.statGridRow}>
              {renderStatCard(STAT_CARDS[2])}
            </View>
          </View>
        </View>

        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <ThemedText style={styles.sectionTitle}>Weekly Progress</ThemedText>
            <ThemedText style={styles.weeklySeeAll}>See All</ThemedText>
          </View>
          <View style={styles.weeklyChart}>
            <View style={styles.weeklyChartInner}>
              {WEEKLY_BARS.map(renderWeeklyBar)}
            </View>
          </View>
        </View>

        <View style={styles.recentSection}>
          <ThemedText style={styles.sectionTitle}>Recent Exercises</ThemedText>
          <View style={styles.recentList}>
            {RECENT_EXERCISES.map(renderRecentExercise)}
          </View>
        </View>
      </ScrollView>

      <NavBar />

      <AlertDialog
        visible={showExitDialog}
        type="warning"
        title="Exit App"
        message="Are you sure you want to exit? Your progress will be saved."
        confirmText="Exit"
        cancelText="Cancel"
        onConfirm={handleExit}
        onCancel={handleCancel}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 32,
  },
  sectionTitle: {
    color: Colors.light.onSurface,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  statsSection: {
    gap: 12,
  },
  statGrid: {
    gap: 12,
  },
  statGridRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
    flex: 1,
  },
  statCardInner: {
    alignItems: "center",
    gap: 4,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: Colors.light.onSurface,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  statLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  statHoverOverlay: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    borderRadius: 16,
  },
  weeklySection: {
    gap: 12,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weeklySeeAll: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  weeklyChart: {
    padding: 24,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  weeklyChartInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    height: 128,
  },
  weekBarContainer: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  weekBarTrack: {
    width: "100%",
    height: 96,
    borderRadius: 9999,
    backgroundColor: Colors.light.surfaceContainerHigh,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  weekBarFill: {
    width: "100%",
    minHeight: 4,
    borderRadius: 9999,
  },
  weekBarLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  weekBarLabelActive: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  recentSection: {
    gap: 12,
  },
  recentList: {
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  exerciseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseTitle: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  exerciseStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  exerciseStatusText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  exerciseXpChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  exerciseXpText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
