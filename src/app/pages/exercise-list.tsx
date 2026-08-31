import { useCallback, useEffect, useState, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { SpellingExercise } from "@/components/exercise/SpellingExercise";
import { FillBlankExercise } from "@/components/exercise/FillBlankExercise";
import { SentenceBuilderExercise } from "@/components/exercise/SentenceBuilderExercise";
import { getTopicById } from "@/backend/Topic";
import {
  getExercisesByTopicIdAndLevel,
  seedExercises,
} from "@/backend/TopicExercise";
import {
  getExerciseTokensByExerciseId,
  seedExerciseTokens,
} from "@/backend/ExerciseTokens";
import { createExerciseAnswer, getExerciseAnswersByExerciseId, deleteExerciseAnswersByExerciseId } from "@/backend/ExerciseAnswer";
import { getUserProfile } from "@/backend/UserProfile";
import { getUserExerciseProgressByUserAndExercise, createUserExerciseProgress, updateUserExerciseProgress } from "@/backend/UserExerciseProgress";
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

interface ExerciseToken {
  exercise_token_id: number;
  exercise_id: number;
  token: string;
  correct_position: number;
}

const LEVEL_TITLES: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  spelling: "Spelling",
  fill_blank_spelling: "Fill in the Blank",
  sentence_builder: "Sentence Builder",
};

export default function ExerciseListPage() {
  const { topic_id, level } = useLocalSearchParams<{
    topic_id: string;
    level: string;
  }>();
  const router = useRouter();
  const [topicTitle, setTopicTitle] = useState<string>("Exercises");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [tokensByExercise, setTokensByExercise] = useState<
    Record<number, ExerciseToken[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<number, string>
  >({});
  const [letterInputs, setLetterInputs] = useState<
    Record<number, string[]>
  >({});
  const [selectedWords, setSelectedWords] = useState<
    Record<number, ExerciseToken[]>
  >({});
  const letterInputRefs = useRef<Record<number, (TextInput | null)[]>>({});
  const [answerResults, setAnswerResults] = useState<
    Record<number, boolean>
  >({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const getCorrectAnswer = (
    tokens: ExerciseToken[],
    exerciseType: string,
  ): string => {
    if (tokens.length === 0) return "";
    return [...tokens]
      .sort((a, b) => a.correct_position - b.correct_position)
      .map((t) => t.token)
      .join(exerciseType === "sentence_builder" ? " " : "");
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        setLoading(true);
        try {
          const db = await getDatabase();
          const topicId = parseInt(topic_id ?? "1", 10);
          const lvl = level ?? "beginner";

          const topic = (await getTopicById(db, topicId)) as { title?: string } | null;
          if (isActive) {
            setTopicTitle(topic?.title ?? "Exercises");
          }

          let exs: Exercise[] =
            (await getExercisesByTopicIdAndLevel(db, topicId, lvl)) ?? [];

          if (exs.length === 0) {
            await seedExercises(db);
            exs = (await getExercisesByTopicIdAndLevel(db, topicId, lvl)) ?? [];
          }

          if (exs.length > 0) {
            const firstTokens = await getExerciseTokensByExerciseId(
              db,
              exs[0].exercise_id,
            );
            if (firstTokens.length === 0) {
              await seedExercises(db);
              await seedExerciseTokens(db);
              exs = (await getExercisesByTopicIdAndLevel(db, topicId, lvl)) ?? [];
            }
          }

          const tokensMap: Record<number, ExerciseToken[]> = {};
          for (const exercise of exs) {
            const tokens = await getExerciseTokensByExerciseId(
              db,
              exercise.exercise_id,
            );
            tokensMap[exercise.exercise_id] = tokens ?? [];
          }

          const savedLetterInputs: Record<number, string[]> = {};
          const savedSubmittedAnswers: Record<number, string> = {};
          const savedSelectedWords: Record<number, ExerciseToken[]> = {};
          const savedAnswerResults: Record<number, boolean> = {};

          for (const exercise of exs) {
            const answers = await getExerciseAnswersByExerciseId(
              db,
              exercise.exercise_id,
            );
            if (answers.length > 0) {
              const savedAnswer = answers[0].answer_text ?? "";
              const exerciseTokens = tokensMap[exercise.exercise_id] ?? [];
              const correctAnswer = getCorrectAnswer(exerciseTokens, exercise.type);
              const isCorrect =
                correctAnswer !== "" &&
                savedAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();

              savedAnswerResults[exercise.exercise_id] = isCorrect;

              if (exercise.type === "spelling") {
                const letters: string[] = [];
                for (let i = 0; i < exerciseTokens.length; i++) {
                  letters[i] = savedAnswer[i] ?? "";
                }
                savedLetterInputs[exercise.exercise_id] = letters;
              } else if (exercise.type === "fill_blank_spelling") {
                savedSubmittedAnswers[exercise.exercise_id] = savedAnswer;
              } else if (exercise.type === "sentence_builder") {
                const words = savedAnswer.split(" ").filter(Boolean);
                const selectedTokens: ExerciseToken[] = [];
                for (const word of words) {
                  const token = exerciseTokens.find((t) => t.token === word);
                  if (token) selectedTokens.push(token);
                }
                savedSelectedWords[exercise.exercise_id] = selectedTokens;
              }
            }
          }

          if (isActive) {
            setExercises(exs);
            setTokensByExercise(tokensMap);
            setLetterInputs(savedLetterInputs);
            setSubmittedAnswers(savedSubmittedAnswers);
            setSelectedWords(savedSelectedWords);
            setAnswerResults(savedAnswerResults);
          }
        } catch (error) {
          console.error("Failed to load exercises", error);
        } finally {
          if (isActive) setLoading(false);
        }
      }

      loadData();

      return () => {
        isActive = false;
      };
    }, [topic_id, level]),
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const db = await getDatabase();
        const profile = await getUserProfile(db);
        if (profile) {
          setUserId(profile.user_id);
        }
      } catch (error) {
        console.error("Failed to load user for progress tracking", error);
      }
    }
    loadUser();
  }, []);

  const goToPrev = () => {
    setCurrentExerciseIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentExerciseIndex((prev) =>
      Math.min(prev + 1, exercises.length - 1),
    );
  };

  const handleSubmitAnswer = async (exercise: Exercise) => {
    if (answerResults[exercise.exercise_id] === true) {
      Alert.alert("Already submitted", "You can only submit one answer per exercise.");
      return;
    }

    const exerciseTokens = tokensByExercise[exercise.exercise_id] ?? [];
    const correctAnswer = getCorrectAnswer(exerciseTokens, exercise.type);
    let submitted = submittedAnswers[exercise.exercise_id] ?? "";

    if (exercise.type === "spelling") {
      const letters = letterInputs[exercise.exercise_id] ?? [];
      submitted = letters.map((l) => (l ?? "").trim()).filter(Boolean).join("");
    } else if (exercise.type === "fill_blank_spelling") {
      submitted = submittedAnswers[exercise.exercise_id] ?? "";
    } else if (exercise.type === "sentence_builder") {
      const words = selectedWords[exercise.exercise_id] ?? [];
      submitted = words.map((w) => w.token).join(" ");
    }

    try {
      const db = await getDatabase();
      if (answerResults[exercise.exercise_id] === false) {
        await deleteExerciseAnswersByExerciseId(db, exercise.exercise_id);
      }
      await createExerciseAnswer(db, {
        exercise_id: exercise.exercise_id,
        answer_text: submitted.trim(),
        is_primary: 0,
      });

      const isCorrect =
        correctAnswer !== "" &&
        submitted.trim().toLowerCase() === correctAnswer.toLowerCase();

      if (userId) {
        const existing = await getUserExerciseProgressByUserAndExercise(
          db,
          userId,
          exercise.exercise_id,
        );
        const attempts = (existing?.attempts_count ?? 0) + 1;
        const now = new Date();
        const recordedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        if (existing) {
          await updateUserExerciseProgress(db, userId, exercise.exercise_id, {
            attempts_count: attempts,
            is_completed: isCorrect,
            completed_at: isCorrect ? now : existing.completed_at,
            recorded_at: now,
          });
        } else {
          await createUserExerciseProgress(db, {
            user_id: userId,
            exercise_id: exercise.exercise_id,
            is_completed: isCorrect,
            attempts_count: attempts,
            completed_at: isCorrect ? now : null,
            recorded_at: now,
          });
        }
      }

      const newResults = { ...answerResults, [exercise.exercise_id]: isCorrect };
      setAnswerResults(newResults);

      const allSubmitted = exercises.every(
        (ex) => newResults[ex.exercise_id] !== undefined,
      );
      if (allSubmitted && !reviewMode) {
        setTimeout(() => setShowCompletionModal(true), 50);
      }

      if (reviewMode && isCorrect) {
        const remaining = exercises.filter(
          (ex) => answerResults[ex.exercise_id] === false,
        );
        if (remaining.length <= 1) {
          setTimeout(() => {
            setReviewMode(false);
            Alert.alert("Great job!", "You've corrected all your mistakes!");
          }, 300);
        }
      }

      if (isCorrect) {
      } else {
        if (exercise.type === "spelling") {
          const firstRef = letterInputRefs.current[exercise.exercise_id]?.[0];
          firstRef?.focus();
        }
      }
    } catch (error) {
      console.error("Failed to submit answer", error);
      Alert.alert("Error", "Failed to submit answer. Please try again.");
    }
  };

  const handleContinue = () => {
    setShowCompletionModal(false);
    setReviewMode(false);
    router.push(`/pages/exercise?topic_id=${topic_id}`);
  };

  const handleReviewMistakes = () => {
    setShowCompletionModal(false);
    setReviewMode(true);
    setCurrentExerciseIndex(0);
  };

  const isSubmitDisabled = (exercise: Exercise): boolean => {
    if (answerResults[exercise.exercise_id] === true) {
      return true;
    }
    if (exercise.type === "spelling") {
      const letters = letterInputs[exercise.exercise_id] ?? [];
      return letters.map((l) => (l ?? "").trim()).filter(Boolean).length === 0;
    }
    if (exercise.type === "sentence_builder") {
      return (selectedWords[exercise.exercise_id] ?? []).length === 0;
    }
    return !(submittedAnswers[exercise.exercise_id] ?? "").trim();
  };

  const levelTitle = LEVEL_TITLES[level ?? "beginner"] ?? "Exercises";

  const totalXP = exercises.reduce((sum, ex) => sum + (ex as any).xp ?? 5, 0);

  const displayExercises = reviewMode
    ? exercises.filter((ex) => answerResults[ex.exercise_id] === false)
    : exercises;

  const completedCount = exercises.filter((ex) => answerResults[ex.exercise_id] === true).length;
  const totalEarnedXP = exercises.reduce((sum, ex) => {
    if (answerResults[ex.exercise_id] === true) {
      return sum + ((ex as any).xp ?? 5);
    }
    return sum;
  }, 0);
  const accuracy = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  return (
    <ThemedView style={styles.container}>
      <AppHeader />

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
        <View style={styles.titleContainer}>
          <ThemedText style={styles.pageTitle}>
            {topicTitle} — {levelTitle}
          </ThemedText>
          <View style={styles.xpBadge}>
            <ThemedText style={styles.xpText}>
              {totalXP} XP
            </ThemedText>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <ThemedText style={styles.loadingText}>Loading exercises...</ThemedText>
        )}
        {!loading && displayExercises.length === 0 && (
          <ThemedText style={styles.noExercisesText}>
            {reviewMode
              ? "No incorrect exercises to review. Great job!"
              : "No exercises available for this level yet."}
          </ThemedText>
        )}
        {!loading && displayExercises.length > 0 && (
          <>
            <View style={styles.progressIndicator}>
              <ThemedText style={styles.progressIndicatorText}>
                {reviewMode
                  ? `Reviewing ${displayExercises.length} incorrect exercise${displayExercises.length !== 1 ? "s" : ""}`
                  : `Exercise ${currentExerciseIndex + 1} of ${displayExercises.length}`}
              </ThemedText>
            </View>

            {(() => {
              const exercise = displayExercises[currentExerciseIndex];
              if (!exercise) return null;

              const typeLabel =
                EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type;
              const exerciseTokens =
                tokensByExercise[exercise.exercise_id] ?? [];
              const correctAnswer = getCorrectAnswer(
                exerciseTokens,
                exercise.type,
              );
              const answerResult = answerResults[exercise.exercise_id];

              const handleLetterChange = (pos: number, value: string) => {
                const letters = letterInputs[exercise.exercise_id] ?? [];
                const newLetters = [...letters];
                newLetters[pos] = value;
                setLetterInputs((prev) => ({
                  ...prev,
                  [exercise.exercise_id]: newLetters,
                }));
              };

              const handleWordToggle = (token: ExerciseToken) => {
                const current = selectedWords[exercise.exercise_id] ?? [];
                const isSelected = current.some(
                  (t) => t.exercise_token_id === token.exercise_token_id,
                );
                if (isSelected) {
                  setSelectedWords((prev) => ({
                    ...prev,
                    [exercise.exercise_id]: prev[exercise.exercise_id]?.filter(
                      (t) => t.exercise_token_id !== token.exercise_token_id,
                    ) ?? [],
                  }));
                } else {
                  setSelectedWords((prev) => ({
                    ...prev,
                    [exercise.exercise_id]: [...(prev[exercise.exercise_id] ?? []), token],
                  }));
                }
              };

              const handleWordRemove = (idx: number) => {
                setSelectedWords((prev) => ({
                  ...prev,
                  [exercise.exercise_id]: prev[exercise.exercise_id]?.filter(
                    (_, i) => i !== idx,
                  ) ?? [],
                }));
              };

              return (
                <View style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <ThemedText style={styles.exerciseNumber}>
                      #{exercise.order_index}
                    </ThemedText>
                    <View
                      style={[
                        styles.exerciseTypeBadge,
                        { backgroundColor: Colors.light.surfaceContainer },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.exerciseType,
                           { color: Colors.light.secondaryContainer },
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
                   {exercise.type === "sentence_builder" &&
                      exerciseTokens.length > 0 && (() => {
                        const shuffledTokens =
                          answerResult === undefined
                            ? [...exerciseTokens].sort(() => Math.random() - 0.5)
                            : exerciseTokens;
                        return (
                          <View style={styles.tokensContainer}>
                            <ThemedText style={styles.tokensLabel}>
                              Arrange these words:
                            </ThemedText>
                            <SentenceBuilderExercise
                              tokens={shuffledTokens}
                              selectedWords={selectedWords[exercise.exercise_id] ?? []}
                              answerResult={answerResult}
                              onWordToggle={handleWordToggle}
                              onWordRemove={handleWordRemove}
                            />
                          </View>
                        );
                      })()}
                   {correctAnswer && (
                    <View style={styles.tokensContainer}>
                      <ThemedText style={styles.tokensLabel}>
                        Answer:
                      </ThemedText>
                      <ThemedText style={styles.tokenText}>
                        {correctAnswer}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.answerForm}>
                    {exercise.type === "spelling" ? (
                      <>
                        {exerciseTokens.length > 0 && (
                          <SpellingExercise
                            tokens={exerciseTokens}
                            letters={letterInputs[exercise.exercise_id] ?? []}
                            answerResult={answerResult}
                            letterRefs={letterInputRefs}
                            exerciseId={exercise.exercise_id}
                            onLetterChange={handleLetterChange}
                          />
                        )}
                      </>
                    ) : exercise.type === "sentence_builder" ? (
                      <View>
                        {(selectedWords[exercise.exercise_id] ?? []).length > 0 && (
                          <View style={styles.arrangedWordsContainer}>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.arrangedWordsRow}
                            >
                              {(selectedWords[exercise.exercise_id] ?? []).map(
                                (word, idx) => (
                                  <Pressable
                                    key={`${word.exercise_token_id}-${idx}`}
                                    style={styles.arrangedWordBox}
                                    onPress={() => handleWordRemove(idx)}
                                  >
                                    <ThemedText style={styles.arrangedWordText}>
                                      {word.token}
                                    </ThemedText>
                                  </Pressable>
                                ),
                              )}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    ) : (
                      <FillBlankExercise
                        value={submittedAnswers[exercise.exercise_id] ?? ""}
                        onChangeText={(text) =>
                          setSubmittedAnswers((prev) => ({
                            ...prev,
                            [exercise.exercise_id]: text,
                          }))
                        }
                        answerResult={answerResult}
                      />
                    )}
                    <Pressable
                      style={[
                        styles.submitButton,
                        isSubmitDisabled(exercise) && styles.submitButtonDisabled,
                      ]}
                      onPress={() => handleSubmitAnswer(exercise)}
                      disabled={isSubmitDisabled(exercise)}
                    >
                      <ThemedText
                        style={[
                          styles.submitButtonText,
                          isSubmitDisabled(exercise) &&
                            styles.submitButtonTextDisabled,
                        ]}
                      >
                        {answerResult === true ? "Correct!" : "Submit"}
                      </ThemedText>
                    </Pressable>
                  </View>
                  {answerResult === true && (
                    <View style={styles.successBanner}>
                      <ThemedText style={styles.successBannerText}>
                        Correct!
                      </ThemedText>
                    </View>
                  )}
                  {answerResult === false && (
                    <View style={styles.errorBanner}>
                      <ThemedText style={styles.errorBannerText}>
                        Incorrect. The correct answer is: {correctAnswer}
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })()}


            <View style={styles.arrowNav}>
              <Pressable
                style={[
                  styles.arrowButton,
                  currentExerciseIndex === 0 && styles.arrowButtonDisabled,
                ]}
                onPress={goToPrev}
                disabled={currentExerciseIndex === 0}
              >
                <SymbolView
                  name={{ ios: "chevron.left", android: "arrow_back_ios", web: "arrow_back_ios" } as any}
                  size={28}
                   tintColor={currentExerciseIndex === 0 ? Colors.light.onSurfaceVariant : Colors.light.primary}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.arrowButton,
                  currentExerciseIndex === displayExercises.length - 1 && styles.arrowButtonDisabled,
                ]}
                onPress={goToNext}
                disabled={currentExerciseIndex === displayExercises.length - 1}
              >
                <SymbolView
                  name={{ ios: "chevron.right", android: "arrow_forward_ios", web: "arrow_forward_ios" } as any}
                  size={28}
                   tintColor={currentExerciseIndex === displayExercises.length - 1 ? Colors.light.onSurfaceVariant : Colors.light.primary}
                />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {!loading && displayExercises.length > 1 && (
        <View style={styles.pagination}>
          {displayExercises.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentExerciseIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

      <NavBar />

      {showCompletionModal && (
        <Modal
          visible={showCompletionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCompletionModal(false)}>
          <View style={styles.completionOverlay}>
            <ScrollView contentContainerStyle={styles.completionContent}>
              <View style={styles.completionIconContainer}>
                <View style={styles.completionIconInner}>
                  <SymbolView
                    name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" } as any}
                    size={48}
                    tintColor={Colors.light.primary}
                  />
                </View>
              </View>

              <ThemedText style={styles.completionTitle}>Lesson Complete!</ThemedText>
              <ThemedText style={styles.completionSubtitle}>{topicTitle}</ThemedText>

              <View style={styles.completionStatsGrid}>
                <View style={styles.completionStatCard}>
                  <SymbolView
                    name={{ ios: "bolt.fill", android: "flash_on", web: "flash_on" } as any}
                    size={28}
                    tintColor={Colors.light.secondary}
                  />
                  <ThemedText style={styles.completionStatValue}>+{totalEarnedXP} XP</ThemedText>
                  <ThemedText style={styles.completionStatLabel}>Earned</ThemedText>
                </View>
                <View style={styles.completionStatCard}>
                  <SymbolView
                    name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" } as any}
                    size={28}
                    tintColor={Colors.light.primary}
                  />
                  <ThemedText style={styles.completionStatValue}>{accuracy}%</ThemedText>
                  <ThemedText style={styles.completionStatLabel}>Accuracy</ThemedText>
                </View>
              </View>

              <View style={styles.completionActions}>
                <Pressable
                  style={styles.completionContinueButton}
                  onPress={handleContinue}>
                  <ThemedText style={styles.completionContinueButtonText}>Continue</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.completionReviewButton}
                  onPress={handleReviewMistakes}>
                  <ThemedText style={styles.completionReviewButtonText}>Review Mistakes</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  pageTitle: {
    color: Colors.light.primary,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  xpBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  xpText: {
    color: Colors.light.onSecondaryContainer,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
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
  headerSpacer: {
    width: 40,
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
    paddingVertical: 24,
  },
  progressIndicator: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  progressIndicatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.onSurfaceVariant,
  },
  exerciseItem: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceContainer,
     shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  tokensContainer: {
    marginTop: 8,
    gap: 6,
  },
  tokensLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.onSurfaceVariant,
    marginBottom: 4,
  },
  tokensScrollContent: {
    gap: 8,
    alignItems: "center",
  },
  tokenText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.onSurface,
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
   answerForm: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
     alignItems: "stretch",
  },
  arrangedWordsContainer: {
    marginTop: 12,
  },
  arrangedWordsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  arrangedWordBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff4e5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.secondaryContainer,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  arrangedWordText: {
    color: "#6f5100",
    fontSize: 16,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButtonTextDisabled: {
    color: Colors.light.onSurfaceVariant,
  },
  successBanner: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  successBannerText: {
    color: Colors.light.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  errorBannerText: {
    color: Colors.light.onError,
    fontSize: 14,
    fontWeight: "600",
  },
  arrowNav: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  arrowButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#22c55e",
    borderBottomWidth: 3,
  },
  arrowButtonDisabled: {
    backgroundColor: Colors.light.surfaceContainer,
    borderColor: Colors.light.outlineVariant,
  },
  pagination: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
    marginBottom: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.surfaceVariant,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: "#22c55e",
  },
  completionOverlay: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  completionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  completionIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.light.surfaceContainerLowest,
  },
  completionIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  completionTitle: {
    color: Colors.light.primary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.02,
    textAlign: "center",
  },
  completionSubtitle: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  completionStatsGrid: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    maxWidth: 320,
  },
  completionStatCard: {
    flex: 1,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  completionStatValue: {
    color: Colors.light.onSurface,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  completionStatLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  completionActions: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    marginTop: 8,
  },
  completionContinueButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
  },
  completionContinueButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  completionReviewButton: {
    backgroundColor: Colors.light.surfaceContainer,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  completionReviewButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
