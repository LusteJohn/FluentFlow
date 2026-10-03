import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/contexts/theme-context";
import { getDatabase } from "@/database/database";
import { getUserProfile } from "@/backend/UserProfile";
import { getAllTopics } from "@/backend/Topic";
import { getAllJourneys } from "@/backend/Journey";
import { getTopicAchievementsByUserId } from "@/backend/TopicAchievement";
import { getJourneyAchievementsByUserId } from "@/backend/JournryAchievement";

const AVATAR_MALE = require("@/assets/images/avatar_male.jpeg");
const AVATAR_FEMALE = require("@/assets/images/avatar_female.jpeg");

const DEFAULT_AVATAR: ImageSourcePropType = AVATAR_MALE;

interface Achievement {
  title: string;
  type: "topic" | "journey";
  achieved_at: string;
}

// The profile stores gender as free text, so any of these read as female and
// everything else (including null) falls back to the male avatar.
function getAvatarForGender(gender: string | null | undefined): ImageSourcePropType {
  if (typeof gender !== "string") return DEFAULT_AVATAR;
  const normalized = gender.trim().toLowerCase();
  if (
    normalized === "female" ||
    normalized === "f" ||
    normalized.startsWith("fem")
  ) {
    return AVATAR_FEMALE;
  }
  return AVATAR_MALE;
}

interface AppHeaderProps {
  /** When provided, the header renders the tutorial help button on the right. */
  onHelpPress?: () => void;
}

export default function AppHeader({ onHelpPress }: AppHeaderProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [avatarSource, setAvatarSource] =
    useState<ImageSourcePropType>(DEFAULT_AVATAR);

  // The avatar is picked from the stored profile as soon as it is available.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDatabase();
        const profile = await getUserProfile(db);
        if (cancelled) return;
        setAvatarSource(getAvatarForGender(profile?.gender));
      } catch (error) {
        console.error("Failed to load avatar", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAchievements = useCallback(async () => {
    setLoadingAchievements(true);
    try {
      const db = await getDatabase();
      const profile = await getUserProfile(db);
      if (!profile) {
        setAchievements([]);
        return;
      }
      const userId = profile.user_id;
      const [topics, journeys, topicAchievements, journeyAchievements] =
        await Promise.all([
          getAllTopics(db),
          getAllJourneys(db),
          getTopicAchievementsByUserId(db, userId),
          getJourneyAchievementsByUserId(db, userId),
        ]);

      const topicMap = new Map(
        (topics ?? []).map((t: any) => [t.topic_id, t.title]),
      );
      const journeyMap = new Map(
        (journeys ?? []).map((j: any) => [j.journey_id, j.title]),
      );

      const combined: Achievement[] = [
        ...topicAchievements.map((a: any) => ({
          title: topicMap.get(a.topic_id) ?? "Unknown Topic",
          type: "topic" as const,
          achieved_at: a.achieved_at,
        })),
        ...journeyAchievements.map((a: any) => ({
          title: journeyMap.get(a.journey_id) ?? "Unknown Journey",
          type: "journey" as const,
          achieved_at: a.achieved_at,
        })),
      ].sort(
        (a, b) =>
          new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime(),
      );

      setAchievements(combined);
    } catch (error) {
      console.error("Failed to load achievements", error);
      setAchievements([]);
    } finally {
      setLoadingAchievements(false);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setShowAchievements(true);
    loadAchievements();
  }, [loadAchievements]);

  const handleClose = useCallback(() => setShowAchievements(false), []);

  return (
    <View style={onHelpPress ? styles.headerRow : undefined}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              resizeMode="cover"
              accessibilityLabel="Profile avatar"
            />
          </View>
          <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
            FluentFlow
          </ThemedText>
        </View>
        <Pressable style={styles.notificationButton} onPress={handleOpen}>
          <SymbolView
            name={{
              ios: "bell",
              android: "notifications",
              web: "notifications",
            }}
            size={22}
            tintColor={theme.onSurfaceVariant}
          />
        </Pressable>
      </View>

      {onHelpPress && (
        <Pressable
          style={styles.helpButton}
          onPress={onHelpPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open tutorial"
        >
          <Image
            source={require("@/assets/images/question.jpeg")}
            style={styles.helpButtonIcon}
            resizeMode="contain"
          />
        </Pressable>
      )}

      <Modal
        visible={showAchievements}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalBackdrop} />
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Achievements ({achievements.length})
              </ThemedText>
              <Pressable style={styles.modalCloseButton} onPress={handleClose}>
                <SymbolView
                  name={{
                    ios: "xmark.circle.fill",
                    android: "close",
                    web: "close",
                  }}
                  size={24}
                  tintColor={theme.onSurfaceVariant}
                />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {achievements.length === 0 ? (
                <ThemedText style={styles.emptyText}>
                  {loadingAchievements
                    ? "Loading achievements..."
                    : "No achievements yet. Complete all exercises in a topic to earn one!"}
                </ThemedText>
              ) : (
                achievements.map((item, index) => (
                  <View
                    key={`${item.type}-${item.title}-${index}`}
                    style={styles.achievementItem}
                  >
                    <View style={styles.achievementIconContainer}>
                      <SymbolView
                        name={
                          {
                            ios:
                              item.type === "topic"
                                ? "rosette.fill"
                                : "sailboat.fill",
                            android:
                              item.type === "topic"
                                ? "emoji_events"
                                : "directions_boat",
                            web: item.type === "topic" ? "star" : "sailing",
                          } as any
                        }
                        size={20}
                        tintColor={theme.primary}
                      />
                    </View>
                    <View style={styles.achievementInfo}>
                      <ThemedText style={styles.achievementTitle}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={styles.achievementType}>
                        {item.type === "topic"
                          ? "Topic Achievement"
                          : "Journey Achievement"}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.achievementDate}>
                      {new Date(item.achieved_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </ThemedText>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    header: {
      alignSelf: "stretch",
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 16,
    },
    helpButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    helpButtonIcon: {
      width: 32,
      height: 32,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexShrink: 0,
    },
    avatarContainer: { width: 40, height: 40 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryContainer,
      borderWidth: 2,
      borderColor: theme.primaryFixed,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modalCard: {
      backgroundColor: theme.surfaceContainerHigh,
      borderRadius: 20,
      width: "100%",
      maxWidth: 400,
      maxHeight: "75%",
      shadowColor: theme.onSurface,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.onSurface,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalContent: {
      paddingHorizontal: 20,
    },
    achievementItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    achievementIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primaryContainer,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.onSurface,
    },
    achievementType: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      marginTop: 2,
    },
    achievementDate: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    emptyText: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
      textAlign: "center",
      paddingVertical: 24,
    },
  });
}
