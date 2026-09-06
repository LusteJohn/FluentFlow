import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { getJourneyById } from "@/backend/Journey";
import { getTopicsByJourneyId } from "@/backend/Topic";
import { getTopicIntrosByTopicId } from "@/backend/TopicIntro";
import { getTopicVocabularyByTopicId } from "@/backend/TopicVocabulary";
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

interface Topic {
  topic_id: number;
  journey_id: number;
  title: string;
  grammar_focus: string;
  order_index: number;
}

interface TopicIntro {
  topic_intro_id: number;
  topic_id: number;
  intro_text: string;
  example_sentence: string;
}

interface TopicVocabulary {
  topic_vocabulary_id: number;
  topic_id: number;
  word: string;
  part_of_speech: string;
  definition: string;
  example_sentence: string;
  image: string | null;
  order_index: number;
}

const JOURNEY_BG_IMAGES: Record<number, any> = {
  1: require("@/assets/images/journey/at_home_bg.png"),
  2: require("@/assets/images/journey/at_school_bg.png"),
  3: require("@/assets/images/journey/at_restaurant_bg.png"),
  4: require("@/assets/images/journey/at_coffee_shop_bg.png"),
  5: require("@/assets/images/journey/at_market_bg.png"),
  6: require("@/assets/images/journey/at_store_bg.png"),
};

const TOPIC_ICONS = [
  { ios: "book.fill", android: "book", web: "book" },
  { ios: "lightbulb.fill", android: "lightbulb", web: "lightbulb" },
  { ios: "graduationcap.fill", android: "school", web: "school" },
  { ios: "pencil.and.slate.fill", android: "edit", web: "edit" },
  { ios: "text.book.closed.fill", android: "menu_book", web: "menu_book" },
];

export default function TopicPage() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { journey_id } = useLocalSearchParams<{ journey_id: string }>();

  const TOPIC_ICON_COLORS = [
    { bg: theme.primaryContainer, text: theme.onPrimaryContainer },
    { bg: theme.secondaryContainer, text: theme.onSecondaryContainer },
    { bg: theme.tertiaryContainer, text: theme.onTertiaryContainer },
    { bg: theme.primaryFixed, text: theme.onPrimaryFixed },
    { bg: theme.secondaryFixed, text: theme.onSecondaryFixed },
  ];
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicIntros, setTopicIntros] = useState<Record<number, TopicIntro>>(
    {},
  );
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [topicVocabulary, setTopicVocabulary] = useState<
    Record<number, TopicVocabulary[]>
  >({});

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        try {
          const db = await getDatabase();
          const journeyId = parseInt(journey_id ?? "1", 10);

          const journeyResult = await getJourneyById(db, journeyId);
          if (isActive) setJourney(journeyResult ?? null);

          const topicsResult = await getTopicsByJourneyId(db, journeyId);
          if (isActive) setTopics(topicsResult ?? []);

          const intros: Record<number, TopicIntro> = {};
          for (const topic of topicsResult ?? []) {
            const introList = await getTopicIntrosByTopicId(db, topic.topic_id);
            if (introList && introList.length > 0) {
              intros[topic.topic_id] = introList[0];
            }
          }
          if (isActive) setTopicIntros(intros);
        } catch (error) {
          console.error("Failed to load topic data", error);
        }
      }

      loadData();

      return () => {
        isActive = false;
      };
    }, [journey_id]),
  );

  const handleViewDetails = async (topicId: number) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
      return;
    }

    if (topicVocabulary[topicId]) {
      setExpandedTopic(topicId);
      return;
    }

    try {
      const db = await getDatabase();
      const vocabList = await getTopicVocabularyByTopicId(db, topicId);
      setTopicVocabulary((prev) => ({
        ...prev,
        [topicId]: vocabList ?? [],
      }));
      setExpandedTopic(topicId);
    } catch (error) {
      console.error("Failed to load vocabulary", error);
    }
  };

  const bgImage = journey ? JOURNEY_BG_IMAGES[journey.journey_id] : null;

  return (
    <ThemedView style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/pages/journey")}
            >
              <SymbolView
                name={
                  {
                    ios: "chevron.left",
                    android: "arrow_back_ios",
                    web: "arrow_back_ios",
                  } as any
                }
                size={24}
                tintColor={theme.onSurface}
              />
            </Pressable>
            <ThemedText style={styles.pageTitle}>
              {journey?.title ?? "Grammar Guide"}
            </ThemedText>
            <SymbolView
              name={
                {
                  ios: "menu.book",
                  android: "menu_book",
                  web: "menu_book",
                } as any
              }
              size={24}
              tintColor={theme.outline}
            />
          </View>

          {journey && (
            <View style={styles.descriptionCard}>
              {bgImage && (
                <Image
                  source={bgImage}
                  style={styles.mascotImage}
                  contentFit="contain"
                />
              )}
              <View style={styles.descriptionContent}>
                <ThemedText style={styles.cardTitle}>
                  {journey.title}
                </ThemedText>
                <ThemedText style={styles.cardDescription}>
                  {journey.description}
                </ThemedText>
              </View>
              <View style={styles.decorativeBlob} />
            </View>
          )}
        </View>

        <View style={styles.examplesSection}>
          <ThemedText style={styles.sectionTitle}>Topics</ThemedText>
          <View style={styles.examplesGrid}>
            {topics.map((topic, index) => {
              const intro = topicIntros[topic.topic_id];
              const iconColor =
                TOPIC_ICON_COLORS[index % TOPIC_ICON_COLORS.length];
              const iconName = TOPIC_ICONS[index % TOPIC_ICONS.length];

              return (
                <View key={topic.topic_id} style={styles.exampleCard}>
                  <View style={styles.exampleCardHeader}>
                    <View
                      style={[
                        styles.exampleIcon,
                        { backgroundColor: iconColor.bg },
                      ]}
                    >
                      <SymbolView
                        name={iconName as any}
                        size={20}
                        tintColor={iconColor.text}
                      />
                    </View>
                    <ThemedText style={styles.exampleTitle}>
                      {topic.title}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.exampleGrammarFocus}>
                    {topic.grammar_focus}
                  </ThemedText>
                  {intro && (
                    <>
                      <ThemedText style={styles.exampleDescription}>
                        {intro.intro_text}
                      </ThemedText>
                      <View style={styles.exampleRow}>
                        <ThemedText style={styles.exampleLabel}>
                          Example:
                        </ThemedText>
                        <ThemedText style={styles.exampleSentence}>
                          {intro.example_sentence}
                        </ThemedText>
                      </View>
                      <View style={styles.actionButtonsRow}>
                        <Pressable
                          style={styles.viewDetailsButton}
                          onPress={() => handleViewDetails(topic.topic_id)}
                        >
                          <ThemedText style={styles.viewDetailsButtonText}>
                            {expandedTopic === topic.topic_id
                              ? "Hide Details"
                              : "View Details"}
                          </ThemedText>
                          <SymbolView
                            name={
                              {
                                ios:
                                  expandedTopic === topic.topic_id
                                    ? "chevron.down"
                                    : "chevron.right",
                                android:
                                  expandedTopic === topic.topic_id
                                    ? "arrow_drop_down"
                                    : "arrow_forward_ios",
                                web:
                                  expandedTopic === topic.topic_id
                                    ? "arrow_drop_down"
                                    : "arrow_forward_ios",
                              } as any
                            }
                            size={16}
                            tintColor={theme.onPrimaryContainer}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.startPracticeButton}
                          onPress={() =>
                            router.push(
                              `/pages/exercise?topic_id=${topic.topic_id}` as any,
                            )
                          }
                        >
                          <ThemedText style={styles.startPracticeButtonText}>
                            Start Practice
                          </ThemedText>
                          <SymbolView
                            name={
                              {
                                ios: "arrow.forward",
                                android: "arrow_forward",
                                web: "arrow_forward",
                              } as any
                            }
                            size={16}
                            tintColor={theme.onPrimaryContainer}
                          />
                        </Pressable>
                      </View>
                      {expandedTopic === topic.topic_id &&
                        topicVocabulary[topic.topic_id] && (
                          <View style={styles.vocabularySection}>
                            <ThemedText style={styles.vocabularySectionTitle}>
                              Vocabulary
                            </ThemedText>
                            {topicVocabulary[topic.topic_id].map((vocab) => (
                              <View
                                key={vocab.topic_vocabulary_id}
                                style={styles.vocabularyItem}
                              >
                                <View style={styles.vocabularyItemHeader}>
                                  <ThemedText style={styles.vocabularyWord}>
                                    {vocab.word}
                                  </ThemedText>
                                  <View style={styles.vocabularyPosBadge}>
                                    <ThemedText style={styles.vocabularyPos}>
                                      {vocab.part_of_speech}
                                    </ThemedText>
                                  </View>
                                </View>
                                <ThemedText style={styles.vocabularyDefinition}>
                                  {vocab.definition}
                                </ThemedText>
                                <ThemedText style={styles.vocabularyExample}>
                                  {vocab.example_sentence}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <NavBar />
    </ThemedView>
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
      gap: 32,
    },
    titleSection: {
      marginTop: 24,
      gap: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: theme.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    pageTitle: {
      color: theme.onSurface,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 32,
      letterSpacing: -0.24,
    },
    descriptionCard: {
      backgroundColor: theme.surfaceContainerLow,
      borderRadius: 16,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      position: "relative",
      overflow: "hidden",
    },
    mascotImage: {
      width: 128,
      height: 128,
    },
    descriptionContent: {
      flex: 1,
      gap: 8,
    },
    cardTitle: {
      color: theme.primary,
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
    },
    cardDescription: {
      color: theme.onSurfaceVariant,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "500",
    },
    decorativeBlob: {
      position: "absolute",
      right: -48,
      top: -48,
      width: 192,
      height: 192,
      borderRadius: 9999,
      backgroundColor: theme.primaryFixed,
      opacity: 0.3,
      pointerEvents: "none",
    },
    examplesSection: {
      gap: 16,
    },
    sectionTitle: {
      color: theme.onSurface,
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
    },
    examplesGrid: {
      gap: 12,
    },
    exampleCard: {
      backgroundColor: theme.surfaceContainerLowest,
      borderRadius: 12,
      padding: 20,
      gap: 12,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.surfaceContainer,
    },
    exampleCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    exampleIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    exampleTitle: {
      color: theme.onSurface,
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 24,
    },
    exampleGrammarFocus: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    exampleDescription: {
      color: theme.onSurfaceVariant,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "500",
    },
    exampleSentence: {
      color: theme.onSurface,
      fontSize: 15,
      lineHeight: 22,
      fontStyle: "italic",
      opacity: 0.8,
    },
    exampleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
    },
    exampleLabel: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
    viewDetailsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.primaryContainer,
    },
    viewDetailsButtonText: {
      color: theme.onPrimaryContainer,
      fontSize: 13,
      fontWeight: "600",
    },
    actionButtonsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      width: "100%",
      marginTop: 8,
    },
    startPracticeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.secondaryContainer,
    },
    startPracticeButtonText: {
      color: theme.onSecondaryContainer,
      fontSize: 13,
      fontWeight: "600",
    },
    vocabularySection: {
      width: "100%",
      gap: 12,
      marginTop: 4,
    },
    vocabularySectionTitle: {
      color: theme.onSurface,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 22,
    },
    vocabularyItem: {
      backgroundColor: theme.surfaceContainerLowest,
      borderRadius: 12,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.surfaceContainer,
      marginBottom: 12,
    },
    vocabularyItemHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 4,
    },
    vocabularyWord: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 24,
    },
    vocabularyPosBadge: {
      backgroundColor: theme.secondaryContainer,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    vocabularyPos: {
      color: theme.onSecondaryContainer,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
    },
    vocabularyDefinition: {
      color: theme.onSurfaceVariant,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "500",
      marginBottom: 4,
    },
    vocabularyExample: {
      color: theme.onSurface,
      fontSize: 14,
      lineHeight: 20,
      fontStyle: "italic",
      opacity: 0.8,
      marginTop: 4,
    },
  });
}
