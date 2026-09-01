import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getTopicById } from "@/backend/Topic";
import { getUserProfile } from "@/backend/UserProfile";
import { getAllLevelProgressForTopic, LevelProgressInfo, EXERCISES_PER_LEVEL } from "@/backend/UserLevelProgress";
import { getDatabase } from "@/database/database";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

interface Topic {
  topic_id: number;
  journey_id: number;
  title: string;
  grammar_focus: string;
  order_index: number;
}

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

interface LevelDisplay {
  title: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
  badgeText: string;
  badgeBg: string;
  progressColor: string;
  activeDots: number;
  totalDots: number;
  progressPercent: number;
}

const LEVEL_BASE: Record<string, Omit<LevelDisplay, "badgeColor" | "badgeText" | "badgeBg" | "activeDots" | "totalDots" | "progressPercent">> = {
  beginner: {
    title: "Beginner",
    description: "Basic vocabulary & simple phrases. Checking in and finding your gate.",
    icon: { ios: "checkmark.circle", android: "check_circle", web: "check_circle" },
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    progressColor: "#22c55e",
  },
  intermediate: {
    title: "Intermediate",
    description: "Conversational dialogues. Handling delays, lost baggage, and security questions.",
    icon: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    progressColor: "#22c55e",
  },
  advanced: {
    title: "Advanced",
    description: "Complex dialogues & technical terms. Negotiating upgrades and resolving disputes.",
    icon: { ios: "checkmark.circle", android: "check_circle", web: "check_circle" },
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    progressColor: "#22c55e",
  },
};

function buildLevelDisplay(
  level: string,
  progress: LevelProgressInfo | undefined,
): LevelDisplay {
  const base = LEVEL_BASE[level];
  const total = progress?.totalCount && progress.totalCount > 0
    ? progress.totalCount
    : EXERCISES_PER_LEVEL;
  const completed = progress?.completedCount ?? 0;
  const percent = Math.min(100, Math.round((completed / total) * 100));
  const filledDots = Math.min(3, Math.round((completed / total) * 3));

  const status = progress?.status ?? "available";
  if (status === "completed") {
    return {
      ...base,
      badgeColor: "#15803d",
      badgeText: "Complete",
      badgeBg: "#dcfce7",
      activeDots: 3,
      totalDots: 3,
      progressPercent: 100,
    };
  }
  if (status === "in_progress") {
    return {
      ...base,
      badgeColor: "#795900",
      badgeText: "In Progress",
      badgeBg: "#fef3c7",
      activeDots: filledDots,
      totalDots: 3,
      progressPercent: percent,
    };
  }
  return {
    ...base,
    badgeColor: "#15803d",
    badgeText: "Available",
    badgeBg: "#dcfce7",
    activeDots: 0,
    totalDots: 3,
    progressPercent: 0,
  };
}

const JOURNEY_ICONS: Record<number, any> = {
  1: { ios: "house.fill", android: "home", web: "home" },
  2: { ios: "book.fill", android: "school", web: "school" },
  3: { ios: "cart.fill", android: "restaurant_menu", web: "restaurant_menu" },
  4: { ios: "cup.fill", android: "coffee", web: "coffee" },
  5: { ios: "cart.fill", android: "shopping_cart", web: "shopping_cart" },
  6: { ios: "cart.fill", android: "storefront", web: "storefront" },
};

export default function ExercisePage() {
  const { topic_id } = useLocalSearchParams<{ topic_id: string }>();
  const router = useRouter();
  const [topicTitle, setTopicTitle] = useState<string>("Exercises");
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [levelProgress, setLevelProgress] = useState<Record<string, LevelProgressInfo>>({});

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        try {
          const db = await getDatabase();
          const topicIdNum = parseInt(topic_id ?? "1", 10);
          const topic = (await getTopicById(db, topicIdNum)) as Topic | null;
          const profile = await getUserProfile(db);
          if (isActive) {
            setTopicTitle(topic?.title ?? "Exercises");
            setJourneyId(topic?.journey_id ?? null);
            if (profile) {
              const progress = await getAllLevelProgressForTopic(
                db,
                profile.user_id,
                topicIdNum,
              );
              setLevelProgress(progress);
            } else {
              setLevelProgress({});
            }
          }
        } catch (error) {
          console.error("Failed to load exercise page", error);
        }
      }

      loadData();

      return () => {
        isActive = false;
      };
    }, [topic_id]),
  );

  const handleViewExercises = (level: string) => {
    router.push(
      `/pages/exercise-list?topic_id=${topic_id}&level=${level}` as any,
    );
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "arrow_back_ios",
                web: "arrow_back_ios",
              } as any}
              size={24}
              tintColor={Colors.light.onSurface}
            />
          </Pressable>
          <ThemedText style={styles.pageTitle}>{topicTitle}</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.introSection}>
          <View style={styles.iconContainer}>
            <SymbolView
              name={JOURNEY_ICONS[journeyId ?? 1]}
              size={48}
              tintColor={Colors.light.secondaryContainer}
            />
          </View>
          <ThemedText style={styles.introTitle}>Select Difficulty</ThemedText>
          <ThemedText style={styles.introDescription}>
            Choose a level that matches your comfort with{" "}
            {topicTitle.toLowerCase()}.
          </ThemedText>
        </View>

        <View style={styles.levelsSection}>
          <ThemedText style={styles.sectionTitle}>Exercise Levels</ThemedText>
          {LEVELS.map((level) => {
            const meta = buildLevelDisplay(level, levelProgress[level]);

            return (
              <View key={level} style={styles.levelCard}>
                <View
                  style={[
                    styles.levelCardHeader,
                  ]}
                >
                  <View
                    style={[
                      styles.levelIconCircle,
                      { backgroundColor: meta.iconBg },
                    ]}
                  >
                    <SymbolView
                      name={meta.icon as any}
                      size={28}
                      tintColor={meta.iconColor}
                    />
                  </View>
                  <View style={styles.levelContent}>
                    <View style={styles.levelTitleRow}>
                      <ThemedText style={styles.levelTitle}>
                        {meta.title}
                      </ThemedText>
                      <View
                        style={[
                          styles.levelBadge,
                          { backgroundColor: meta.badgeBg },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.levelBadgeText,
                            { color: meta.badgeColor },
                          ]}
                        >
                          {meta.badgeText}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.levelDescription}>
                      {meta.description}
                    </ThemedText>
                    <View style={styles.progressDots}>
                      {[0, 1, 2].map((dot) => {
                        const filled = dot < meta.activeDots;
                        return (
                          <View
                            key={dot}
                            style={[
                              styles.progressDot,
                              filled
                                ? [
                                    styles.progressDotFilled,
                                    { backgroundColor: meta.progressColor },
                                  ]
                                : styles.progressDotEmpty,
                            ]}
                          />
                        );
                      })}
                    </View>
                    <ThemedText style={styles.progressPercentText}>
                      {meta.progressPercent}% ({meta.activeDots}/{meta.totalDots} milestones)
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.viewButtonContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.viewButton,
                      pressed && styles.viewButtonPressed,
                    ]}
                    onPress={() => handleViewExercises(level)}
                  >
                    <ThemedText style={styles.viewButtonText}>
                      View Exercises
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <NavBar />
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
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  pageTitle: {
    color: Colors.light.primary,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  introSection: {
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  introTitle: {
    color: Colors.light.onSurface,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  introDescription: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  levelsSection: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.light.onSurface,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  levelCard: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceContainer,
    overflow: "hidden",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  levelCardActive: {
    borderWidth: 2,
    borderColor: Colors.light.secondaryContainer,
    backgroundColor: "#fff4e5",
  },
  levelCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  levelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  levelContent: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    color: Colors.light.onSurface,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  levelDescription: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    color: Colors.light.onSurfaceVariant,
    marginTop: 2,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  progressDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
  },
  progressDotFilled: {},
  progressDotEmpty: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  progressPercentText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#15803d",
  },
  viewButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceContainer,
  },
  viewButton: {
    backgroundColor: "#dcfce7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#86efac",
  },
  viewButtonPressed: {
    borderBottomWidth: 0,
    transform: [{ translateY: 2 }],
  },
  viewButtonText: {
    color: "#15803d",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
