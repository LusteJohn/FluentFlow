import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getAllJourneys } from "@/backend/Journey";
import { getDatabase } from "@/database/database";
import NavBar from "../(tabs)/navBar";

interface Journey {
  journey_id: number;
  title: string;
  description: string;
  icon: string;
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

export default function JourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

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
        } catch (error) {
          console.error("Failed to load journeys", error);
          if (isActive) {
            setJourneys([]);
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

  const completedCount = journeys.filter((_, i) => i === 0).length;
  const inProgressIndex = journeys.length > 1 ? 1 : -1;

  return (
    <ThemedView style={styles.container}>
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
            Lumina Learning
          </ThemedText>
        </View>
        <View style={styles.notificationButton}>
          <ThemedText style={styles.notificationIcon}>🔔</ThemedText>
        </View>
      </View>

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
            const isCompleted = index === 0;
            const isInProgress = index === inProgressIndex;
            const isLocked = index > inProgressIndex && inProgressIndex >= 0;
            const nodeSize = isInProgress ? 80 : 64;
            const iconSize = isInProgress ? 40 : 32;

            return (
              <View key={journey.journey_id} style={styles.pathNodeContainer}>
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
                    isInProgress && styles.nodeCardActive,
                    isLocked && styles.nodeCardLocked,
                  ]}>
                  {isInProgress && (
                    <View style={styles.cardImagePlaceholder}>
                      <Image
                        source={JOURNEY_IMAGES[journey.title]}
                        style={styles.cardImage}
                        contentFit="cover"
                      />
                    </View>
                  )}
                  {isCompleted && (
                    <View style={[styles.cardImagePlaceholder, styles.cardImageCompleted]}>
                      <Image
                        source={JOURNEY_IMAGES[journey.title]}
                        style={[styles.cardImage, styles.cardImageCompletedInner]}
                        contentFit="cover"
                      />
                    </View>
                  )}
                  {isLocked && (
                    <View style={[styles.cardImagePlaceholder, styles.cardImageLocked]}>
                      <Image
                        source={JOURNEY_IMAGES[journey.title]}
                        style={[styles.cardImage, styles.cardImageLockedInner]}
                        contentFit="cover"
                      />
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <ThemedText
                      type={isInProgress ? "headlineMd" : "labelSm"}
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
                    {isInProgress && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: "60%" }]} />
                        </View>
                        <ThemedText type="labelSm" style={styles.progressText}>
                          60% Complete
                        </ThemedText>
                      </View>
                    )}
                    {isLocked && (
                      <ThemedText type="bodySm" style={styles.cardStatusLocked}>
                        Complete previous to unlock
                      </ThemedText>
                    )}
                  </View>
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
