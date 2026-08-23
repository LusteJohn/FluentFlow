import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getTopicById } from "@/backend/Topic";
import { getExercisesByTopicIdAndLevel } from "@/backend/TopicExercise";
import { getDatabase } from "@/database/database";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

interface Exercise {
  exercise_id: number;
  topic_id: number;
  level: string;
  type: string;
  prompt: string;
  context_sentence: string | null;
  order_index: number;
}

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

const LEVEL_META: Record<string, {
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
}> = {
  beginner: {
    title: "Beginner",
    description: "Basic vocabulary & simple phrases. Checking in and finding your gate.",
    icon: { ios: "checkmark.circle", android: "check_circle", web: "check_circle" },
    iconBg: Colors.light.secondaryFixedDim,
    iconColor: Colors.light.onSecondaryContainer,
    badgeColor: Colors.light.onSecondaryContainer,
    badgeText: "Completed",
    badgeBg: Colors.light.secondaryContainer,
    progressColor: Colors.light.onPrimaryContainer,
    activeDots: 3,
  },
  intermediate: {
    title: "Intermediate",
    description: "Conversational dialogues. Handling delays, lost baggage, and security questions.",
    icon: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
    iconBg: Colors.light.onPrimaryContainer,
    iconColor: Colors.light.primaryContainer,
    badgeColor: Colors.light.onPrimaryContainer,
    badgeText: "Current",
    badgeBg: Colors.light.onPrimaryContainer,
    progressColor: Colors.light.onPrimaryContainer,
    activeDots: 2,
  },
  advanced: {
    title: "Advanced",
    description: "Complex dialogues & technical terms. Negotiating upgrades and resolving disputes.",
    icon: { ios: "lock.fill", android: "lock", web: "lock" },
    iconBg: Colors.light.surfaceVariant,
    iconColor: Colors.light.outline,
    badgeColor: Colors.light.onSurfaceVariant,
    badgeText: "Locked",
    badgeBg: Colors.light.surfaceVariant,
    progressColor: Colors.light.outline,
    activeDots: 0,
  },
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  spelling: "Spelling",
  fill_blank_spelling: "Fill in the Blank",
  sentence_builder: "Sentence Builder",
};

export default function ExercisePage() {
  const { topic_id } = useLocalSearchParams<{ topic_id: string }>();
  const router = useRouter();
  const [topicTitle, setTopicTitle] = useState<string>("Exercises");
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [exercisesByLevel, setExercisesByLevel] = useState<
    Record<string, Exercise[]>
  >({});
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        try {
          const db = await getDatabase();
          const topicId = parseInt(topic_id ?? "1", 10);
          const topic = await getTopicById(db, topicId);
          if (isActive) {
            setTopicTitle(topic?.title ?? "Exercises");
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

  const handleViewExercises = async (level: string) => {
    if (expandedLevel === level) {
      setExpandedLevel(null);
      return;
    }

    if (exercisesByLevel[level]) {
      setExpandedLevel(level);
      return;
    }

    setLoadingLevel(level);
    try {
      const db = await getDatabase();
      const topicId = parseInt(topic_id ?? "1", 10);
      const list = await getExercisesByTopicIdAndLevel(db, topicId, level);
      setExercisesByLevel((prev) => ({
        ...prev,
        [level]: list ?? [],
      }));
      setExpandedLevel(level);
    } catch (error) {
      console.error("Failed to load exercises", error);
    } finally {
      setLoadingLevel(null);
    }
  };

  const isLevelLocked = (level: string): boolean => {
    return LEVEL_META[level]?.badgeText === "Locked";
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
              name={{
                ios: "flight.deployment.fill",
                android: "flight_takeoff",
                web: "flight_takeoff",
              } as any}
              size={48}
              tintColor={Colors.light.primary}
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
            const meta = LEVEL_META[level];
            const locked = isLevelLocked(level);
            const exerciseList = exercisesByLevel[level] ?? [];
            const hasExercises = exerciseList.length > 0;
            const isExpanded = expandedLevel === level;
            const isLoading = loadingLevel === level;

            return (
              <View key={level} style={styles.levelCard}>
                <View
                  style={[
                    styles.levelCardHeader,
                    level === "intermediate" && styles.levelCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.levelIconCircle,
                      { backgroundColor: meta.iconBg },
                    ]}
                  >
                    {locked ? (
                      <SymbolView
                        name={meta.icon as any}
                        size={28}
                        tintColor={meta.iconColor}
                      />
                    ) : (
                      <SymbolView
                        name={meta.icon as any}
                        size={28}
                        tintColor={meta.iconColor}
                      />
                    )}
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
                  </View>
                </View>

                {!locked && (
                  <>
                    <View style={styles.viewButtonContainer}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.viewButton,
                          pressed && styles.viewButtonPressed,
                        ]}
                        onPress={() => handleViewExercises(level)}
                      >
                        <ThemedText style={styles.viewButtonText}>
                          {isExpanded ? "Hide Exercises" : "View Exercises"}
                        </ThemedText>
                      </Pressable>
                    </View>

                    {isExpanded && (
                      <View style={styles.exercisesContainer}>
                        {isLoading && (
                          <ThemedText style={styles.loadingText}>
                            Loading exercises...
                          </ThemedText>
                        )}
                        {!isLoading && hasExercises && (
                          <>
                            <View style={styles.exerciseCount}>
                              <ThemedText style={styles.exerciseCountText}>
                                {exerciseList.length} exercises
                              </ThemedText>
                            </View>
                            {exerciseList.map((exercise) => {
                              const typeLabel =
                                EXERCISE_TYPE_LABELS[exercise.type] ??
                                exercise.type;

                              return (
                                <View
                                  key={exercise.exercise_id}
                                  style={styles.exerciseItem}
                                >
                                  <View style={styles.exerciseHeader}>
                                    <ThemedText style={styles.exerciseNumber}>
                                      #{exercise.order_index}
                                    </ThemedText>
                                    <View
                                      style={[
                                        styles.exerciseTypeBadge,
                                        {
                                          backgroundColor:
                                            Colors.light.surfaceContainer,
                                        },
                                      ]}
                                    >
                                      <ThemedText
                                        style={[
                                          styles.exerciseType,
                                          { color: meta.progressColor },
                                        ]}
                                      >
                                        {typeLabel}
                                      </ThemedText>
                                    </View>
                                  </View>
                                  <ThemedText style={styles.exercisePrompt}>
                                    {exercise.prompt}
                                  </ThemedText>
                                  {exercise.context_sentence && (
                                    <ThemedText style={styles.exerciseContext}>
                                      {exercise.context_sentence}
                                    </ThemedText>
                                  )}
                                </View>
                              );
                            })}
                          </>
                        )}
                        {!isLoading && !hasExercises && (
                          <ThemedText style={styles.noExercisesText}>
                            No exercises available for this level yet.
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </>
                )}
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
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryContainer,
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
  viewButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceContainer,
  },
  viewButton: {
    backgroundColor: Colors.light.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  viewButtonPressed: {
    borderBottomWidth: 0,
    transform: [{ translateY: 2 }],
  },
  viewButtonText: {
    color: Colors.light.onPrimaryContainer,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  exercisesContainer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceContainer,
  },
  exerciseCount: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  exerciseCountText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: Colors.light.onSurfaceVariant,
  },
  exerciseItem: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceContainer,
    gap: 6,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseNumber: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: Colors.light.onSurface,
  },
  exerciseTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exerciseType: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  exercisePrompt: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    color: Colors.light.onSurface,
  },
  exerciseContext: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    color: Colors.light.onSurfaceVariant,
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  noExercisesText: {
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: 12,
  },
});
