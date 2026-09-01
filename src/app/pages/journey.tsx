import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getAllJourneys, getAllJourneyProgressForUser } from "@/backend/Journey";
import { getUserProfile } from "@/backend/UserProfile";
import { getDatabase } from "@/database/database";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

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
  const router = useRouter();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [journeyProgress, setJourneyProgress] = useState<Record<number, { totalExercises: number; completedExercises: number; percent: number }>>({});

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
            const progress = await getAllJourneyProgressForUser(db, profile.user_id);
            if (isActive) {
              setJourneyProgress(progress ?? {});
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
    <ThemedView style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <ThemedText type="headlineMd" style={styles.pageTitle}>
            Journey Map
          </ThemedText>
          <ThemedText type="bodyMd" style={styles.pageSubtitle}>
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
            const isLocked = !isCompleted && !isInProgress && index > 0 && (() => {
              const prev = journeys[index - 1];
              const prevProgress = prev ? journeyProgress[prev.journey_id] : null;
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
                }>
                <View
                  style={[
                    styles.pathNode,
                    isCompleted && styles.nodeCompleted,
                    isInProgress && styles.nodeInProgress,
                    isLocked && styles.nodeLocked,
                    { width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2 },
                  ]}>
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
                      <ThemedText style={styles.statusBadgeText}>✓</ThemedText>
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
                  ]}>
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
                      type={(isCompleted || isInProgress) ? "headlineMd" : "labelSm"}
                      style={[
                        styles.cardTitle,
                        isLocked && styles.cardTitleLocked,
                      ]}>
                      {journey.title}
                    </ThemedText>
                    {isCompleted && (
                      <ThemedText type="bodySm" style={styles.cardStatus}>
                        Mastered
                      </ThemedText>
                    )}
                    {(isInProgress || isCompleted) && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${percent}%` }]} />
                        </View>
                        <ThemedText type="labelSm" style={styles.progressText}>
                          {percent}% Complete ({progress?.completedExercises ?? 0}/{progress?.totalExercises ?? 0})
                        </ThemedText>
                      </View>
                    )}
                    {isNotStarted && !isLocked && (
                      <ThemedText type="bodySm" style={styles.cardStatus}>
                        Not started yet
                      </ThemedText>
                    )}
                    {isLocked && (
                      <ThemedText type="bodySm" style={styles.cardStatusLocked}>
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
  },
  titleSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  pageTitle: {
    color: Colors.light.onSurface,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  pageSubtitle: {
    color: Colors.light.onSurfaceVariant,
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
    backgroundColor: Colors.light.surfaceContainerHigh,
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
    borderColor: Colors.light.surface,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
    zIndex: 10,
  },
  nodeCompleted: {
    backgroundColor: Colors.light.primary,
  },
  nodeInProgress: {
    backgroundColor: Colors.light.primaryContainer,
    borderWidth: 4,
    borderColor: Colors.light.surface,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    ringWidth: 4,
    ringColor: Colors.light.primary,
  },
  nodeLocked: {
    backgroundColor: Colors.light.surfaceContainerHigh,
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  nodeIcon: {
    color: Colors.light.onPrimary,
    fontWeight: "700",
  },
  nodeIconLocked: {
    color: Colors.light.outline,
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
    borderColor: Colors.light.surface,
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
    backgroundColor: Colors.light.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
  lockBadgeText: {
    fontSize: 14,
  },
  nodeCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.surfaceContainer,
  },
  nodeCardActive: {
    borderWidth: 1,
    borderColor: Colors.light.primaryFixedDim,
  },
  nodeCardLocked: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    opacity: 0.75,
  },
  cardImagePlaceholder: {
    height: 128,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceContainerHigh,
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
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  cardImageLockedInner: {
    opacity: 0.4,
  },
  cardContent: {
    alignItems: "center",
  },
  cardTitle: {
    color: Colors.light.onSurface,
    marginBottom: 4,
    textAlign: "center",
  },
  cardTitleLocked: {
    color: Colors.light.onSurfaceVariant,
  },
  cardStatus: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 14,
    marginTop: 4,
  },
  cardStatusLocked: {
    color: Colors.light.onSurfaceVariant,
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
    backgroundColor: Colors.light.primaryContainer,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  progressText: {
    color: Colors.light.primary,
    textAlign: "center",
    fontWeight: "600",
  },
});
