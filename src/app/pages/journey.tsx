import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
    getAllJourneyProgressForUser,
    getAllJourneys,
} from "@/backend/Journey";
import { getUserProfile } from "@/backend/UserProfile";
import { ScreenMotion } from "@/components/screen-motion";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/contexts/theme-context";
import { getDatabase } from "@/database/database";
import AppHeader from "../(tabs)/header";
import NavBar from "../(tabs)/navBar";

interface Journey {
  journey_id: number;
  title: string;
  description: string;
  icon: string;
  bg_image: string;
  order_index: number;
}

const JOURNEY_IMAGES: Record<string, any> = {
  "At Home": require("@/assets/images/journey/at_home.png"),
  "At School": require("@/assets/images/journey/at_school.png"),
  "At Restaurant": require("@/assets/images/journey/at_restaurant.png"),
  "At Coffee Shop": require("@/assets/images/journey/at_coffee_shop.png"),
  "At Market": require("@/assets/images/journey/at_market.png"),
  "At Store": require("@/assets/images/journey/at_store.png"),
};

const JOURNEY_BG_IMAGES: Record<number, any> = {
  1: require("@/assets/images/journey/at_home_bg.png"),
  2: require("@/assets/images/journey/at_school_bg.png"),
  3: require("@/assets/images/journey/at_restaurant_bg.png"),
  4: require("@/assets/images/journey/at_coffee_shop_bg.png"),
  5: require("@/assets/images/journey/at_market_bg.png"),
  6: require("@/assets/images/journey/at_store_bg.png"),
};

export default function JourneyPage() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [journeyProgress, setJourneyProgress] = useState<
    Record<
      number,
      { totalExercises: number; completedExercises: number; percent: number }
    >
  >({});

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadJourneys() {
        try {
          const db = await getDatabase();
          const result = await getAllJourneys(db);
          if (isActive) {
            setJourneys(result ?? []);
          }
          const profile = await getUserProfile(db);
          if (isActive && profile) {
            const progress = await getAllJourneyProgressForUser(
              db,
              profile.user_id,
            );
            if (isActive) {
              setJourneyProgress(
                (progress ?? {}) as Record<
                  number,
                  {
                    totalExercises: number;
                    completedExercises: number;
                    percent: number;
                  }
                >,
              );
            }
          } else if (isActive) {
            setJourneyProgress({});
          }
        } catch (error) {
          console.error("Failed to load journeys", error);
          if (isActive) {
            setJourneys([]);
            setJourneyProgress({});
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadJourneys();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const firstInProgressIndex = journeys.findIndex((j) => {
    const p = journeyProgress[j.journey_id];
    return !p || p.percent < 100;
  });
  const inProgressIndex = firstInProgressIndex >= 0 ? firstInProgressIndex : -1;

  return (
    <ScreenMotion>
      <ThemedView style={styles.container}>
        <AppHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.pageTitle}>
              Journey Map
            </ThemedText>
            <ThemedText type="default" style={styles.pageSubtitle}>
              Master real-world situations
            </ThemedText>
          </View>

          <View style={styles.pathContainer}>
            <View style={styles.pathLine} />

            {journeys.map((journey, index) => {
              const progress = journeyProgress[journey.journey_id];
              const percent = progress?.percent ?? 0;
              const isCompleted = percent === 100;
              const isInProgress = !isCompleted && percent > 0;
              const isNotStarted = percent === 0;
              const isLocked =
                !isCompleted &&
                !isInProgress &&
                index > 0 &&
                (() => {
                  const prev = journeys[index - 1];
                  const prevProgress = prev
                    ? journeyProgress[prev.journey_id]
                    : null;
                  return !prevProgress || prevProgress.percent < 100;
                })();
              const nodeSize = isCompleted || isInProgress ? 80 : 64;
              const iconSize = isCompleted || isInProgress ? 40 : 32;
              const bgImage = JOURNEY_BG_IMAGES[journey.journey_id];

              return (
                <Pressable
                  key={journey.journey_id}
                  style={({ pressed }) => [
                    styles.pathNodeContainer,
                    !isLocked && pressed && { opacity: 0.9 },
                  ]}
                  onPress={() =>
                    !isLocked &&
                    router.push(`/pages/topic?journey_id=${journey.journey_id}`)
                  }
                >
                  <View
                    style={[
                      styles.pathNode,
                      isCompleted && styles.nodeCompleted,
                      isInProgress && styles.nodeInProgress,
                      isLocked && styles.nodeLocked,
                      {
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius: nodeSize / 2,
                      },
                    ]}
                  >
                    {journey.title in JOURNEY_IMAGES && (
                      <Image
                        source={JOURNEY_IMAGES[journey.title]}
                        style={[
                          styles.nodeImage,
                          isLocked && styles.nodeImageLocked,
                          { width: iconSize, height: iconSize },
                        ]}
                        contentFit="contain"
                      />
                    )}

                    {isCompleted && (
                      <View style={styles.statusBadge}>
                        <ThemedText style={styles.statusBadgeText}>
                          ✓
                        </ThemedText>
                      </View>
                    )}
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <ThemedText style={styles.lockBadgeText}>🔒</ThemedText>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.nodeCard,
                      (isCompleted || isInProgress) && styles.nodeCardActive,
                      isLocked && styles.nodeCardLocked,
                    ]}
                  >
                    {bgImage && (
                      <View
                        style={[
                          styles.cardImagePlaceholder,
                          isCompleted && styles.cardImageCompleted,
                          isLocked && styles.cardImageLocked,
                        ]}
                      >
                        <Image
                          source={bgImage}
                          style={[
                            styles.cardImage,
                            isCompleted && styles.cardImageCompletedInner,
                            isLocked && styles.cardImageLockedInner,
                          ]}
                          contentFit="cover"
                        />
                      </View>
                    )}
                    <View style={styles.cardContent}>
                      <ThemedText
                        type={isCompleted || isInProgress ? "title" : "small"}
                        style={[
                          styles.cardTitle,
                          isLocked && styles.cardTitleLocked,
                        ]}
                      >
                        {journey.title}
                      </ThemedText>
                      {isCompleted && (
                        <ThemedText type="small" style={styles.cardStatus}>
                          Mastered
                        </ThemedText>
                      )}
                      {(isInProgress || isCompleted) && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${percent}%` },
                              ]}
                            />
                          </View>
                          <ThemedText type="small" style={styles.progressText}>
                            {percent}% Complete (
                            {progress?.completedExercises ?? 0}/
                            {progress?.totalExercises ?? 0})
                          </ThemedText>
                        </View>
                      )}
                      {isNotStarted && !isLocked && (
                        <ThemedText type="small" style={styles.cardStatus}>
                          Not started yet
                        </ThemedText>
                      )}
                      {isLocked && (
                        <ThemedText
                          type="small"
                          style={styles.cardStatusLocked}
                        >
                          Complete previous to unlock
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <NavBar />
      </ThemedView>
    </ScreenMotion>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    titleSection: {
      alignItems: "center",
      marginTop: 32,
      marginBottom: 40,
    },
    pageTitle: {
      color: theme.onSurface,
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 8,
    },
    pageSubtitle: {
      color: theme.onSurfaceVariant,
      fontSize: 16,
      fontWeight: "500",
    },
    pathContainer: {
      position: "relative",
      alignItems: "center",
    },
    pathLine: {
      position: "absolute",
      width: 4,
      backgroundColor: theme.surfaceContainerHigh,
      borderRadius: 2,
      top: 32,
      bottom: 32,
      left: "50%",
      marginLeft: -2,
    },
    pathNodeContainer: {
      width: "100%",
      alignItems: "center",
      marginBottom: 48,
      position: "relative",
    },
    pathNode: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 4,
      borderColor: theme.surface,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
      position: "relative",
      zIndex: 10,
    },
    nodeCompleted: {
      backgroundColor: theme.primary,
    },
    nodeInProgress: {
      backgroundColor: theme.primaryContainer,
      borderWidth: 4,
      borderColor: theme.surface,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    nodeLocked: {
      backgroundColor: theme.surfaceContainerHigh,
      shadowColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
    nodeIcon: {
      color: theme.onPrimary,
      fontWeight: "700",
    },
    nodeIconLocked: {
      color: theme.outline,
    },
    nodeImage: {
      borderRadius: 9999,
    },
    nodeImageLocked: {
      opacity: 0.5,
    },
    statusBadge: {
      position: "absolute",
      right: -8,
      bottom: -8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#34d399",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.surface,
    },
    statusBadgeText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },
    lockBadge: {
      position: "absolute",
      right: -8,
      bottom: -8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceContainerHighest,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.surface,
    },
    lockBadgeText: {
      fontSize: 14,
    },
    nodeCard: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: theme.surfaceContainerLowest,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.surfaceContainer,
    },
    nodeCardActive: {
      borderWidth: 1,
      borderColor: theme.primaryFixedDim,
    },
    nodeCardLocked: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      opacity: 0.75,
    },
    cardImagePlaceholder: {
      height: 128,
      borderRadius: 12,
      backgroundColor: theme.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      overflow: "hidden",
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    cardImageCompleted: {
      opacity: 0.9,
    },
    cardImageCompletedInner: {
      opacity: 0.7,
    },
    cardImageLocked: {
      backgroundColor: theme.surfaceContainerHigh,
    },
    cardImageLockedInner: {
      opacity: 0.4,
    },
    cardContent: {
      alignItems: "center",
    },
    cardTitle: {
      color: theme.onSurface,
      marginBottom: 4,
      textAlign: "center",
    },
    cardTitleLocked: {
      color: theme.onSurfaceVariant,
    },
    cardStatus: {
      color: theme.onSurfaceVariant,
      fontSize: 14,
      marginTop: 4,
    },
    cardStatusLocked: {
      color: theme.onSurfaceVariant,
      fontSize: 14,
      marginTop: 4,
      fontStyle: "italic",
    },
    progressContainer: {
      width: "100%",
      marginTop: 12,
      gap: 8,
    },
    progressTrack: {
      width: "100%",
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.primaryContainer,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: theme.primary,
    },
    progressText: {
      color: theme.primary,
      textAlign: "center",
      fontWeight: "600",
    },
  });
}
