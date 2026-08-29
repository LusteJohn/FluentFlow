import { useCallback, useState, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getTopicById } from "@/backend/Topic";
import {
  getExercisesByTopicIdAndLevel,
  seedExercises,
} from "@/backend/TopicExercise";
import {
  getExerciseTokensByExerciseId,
  seedExerciseTokens,
} from "@/backend/ExerciseTokens";
import { createExerciseAnswer } from "@/backend/ExerciseAnswer";
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
  const { width: screenWidth } = useWindowDimensions();

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

          if (isActive) {
            setExercises(exs);
            setTokensByExercise(tokensMap);
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

  const goToPrev = () => {
    setCurrentExerciseIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentExerciseIndex((prev) =>
      Math.min(prev + 1, exercises.length - 1),
    );
  };

  const handleSubmitAnswer = async (exercise: Exercise) => {
    const exerciseTokens = tokensByExercise[exercise.exercise_id] ?? [];
    const correctAnswer = getCorrectAnswer(exerciseTokens, exercise.type);
    let submitted = submittedAnswers[exercise.exercise_id] ?? "";

    if (exercise.type === "spelling") {
      const letters = letterInputs[exercise.exercise_id] ?? [];
      submitted = letters.map((l) => l.trim()).filter(Boolean).join("");
    } else if (exercise.type === "fill_blank_spelling") {
      submitted = submittedAnswers[exercise.exercise_id] ?? "";
    } else if (exercise.type === "sentence_builder") {
      const words = selectedWords[exercise.exercise_id] ?? [];
      submitted = words.map((w) => w.token).join(" ");
    }

    try {
      const db = await getDatabase();
      await createExerciseAnswer(db, {
        exercise_id: exercise.exercise_id,
        answer_text: submitted.trim(),
        is_primary: 0,
      });

      const isCorrect =
        correctAnswer !== "" &&
        submitted.trim().toLowerCase() === correctAnswer.toLowerCase();

      setAnswerResults((prev) => ({
        ...prev,
        [exercise.exercise_id]: isCorrect,
      }));

      if (isCorrect) {
        Alert.alert("Correct!", "Well done.");
      } else {
        Alert.alert("Incorrect", `The correct answer is: ${correctAnswer}`);
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

  const isSubmitDisabled = (exercise: Exercise): boolean => {
    if (exercise.type === "spelling") {
      const letters = letterInputs[exercise.exercise_id] ?? [];
      return letters.map((l) => l.trim()).filter(Boolean).length === 0;
    }
    if (exercise.type === "sentence_builder") {
      return (selectedWords[exercise.exercise_id] ?? []).length === 0;
    }
    return !(submittedAnswers[exercise.exercise_id] ?? "").trim();
  };

  const levelTitle = LEVEL_TITLES[level ?? "beginner"] ?? "Exercises";

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
        <ThemedText style={styles.pageTitle}>
          {topicTitle} — {levelTitle}
        </ThemedText>
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
        {!loading && exercises.length === 0 && (
          <ThemedText style={styles.noExercisesText}>
            No exercises available for this level yet.
          </ThemedText>
        )}
        {!loading && exercises.length > 0 && (
          <>
            <View style={styles.progressIndicator}>
              <ThemedText style={styles.progressIndicatorText}>
                Exercise {currentExerciseIndex + 1} of {exercises.length}
              </ThemedText>
            </View>

            {/* eslint-disable react-hooks/refs */}
            {(() => {
              const exercise = exercises[currentExerciseIndex];
              const typeLabel =
                EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type;
              const exerciseTokens =
                tokensByExercise[exercise.exercise_id] ?? [];
              const correctAnswer = getCorrectAnswer(
                exerciseTokens,
                exercise.type,
              );

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
                          { color: Colors.light.primary },
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
                     exerciseTokens.length > 0 && (
                     <View style={styles.tokensContainer}>
                       <ThemedText style={styles.tokensLabel}>
                         Arrange these words:
                       </ThemedText>
                       <ScrollView
                         horizontal
                         showsHorizontalScrollIndicator={false}
                         contentContainerStyle={styles.tokensScrollContent}
                       >
                         {exerciseTokens
                           .slice()
                           .sort((a, b) => a.correct_position - b.correct_position)
                           .map((token) => {
                             const isSelected =
                               (selectedWords[exercise.exercise_id] ?? []).some(
                                 (t) => t.exercise_token_id === token.exercise_token_id,
                               );
                             return (
                               <Pressable
                                 key={token.exercise_token_id}
                                 style={[
                                   styles.wordBox,
                                   isSelected && styles.wordBoxSelected,
                                 ]}
                                 onPress={() => {
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
                                       [exercise.exercise_id]: [
                                         ...(prev[exercise.exercise_id] ?? []),
                                         token,
                                       ],
                                     }));
                                   }
                                 }}
                               >
                                 <ThemedText
                                   style={[
                                     styles.tokenText,
                                     isSelected && styles.tokenTextSelected,
                                   ]}
                                 >
                                   {token.token}
                                 </ThemedText>
                               </Pressable>
                             );
                           })}
                       </ScrollView>
                     </View>
                   )}
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
                        {exerciseTokens.length > 0 && (() => {
                          const totalGap = (exerciseTokens.length - 1) * 8;
                          const maxBoxWidth = (screenWidth - 40 - totalGap) / exerciseTokens.length;
                          const boxWidth = Math.min(48, Math.max(32, maxBoxWidth));

                          return (
                            <View style={[styles.letterBoxesRow, { gap: 8 }]}>
                              {exerciseTokens.map((token) => {
                                const pos = token.correct_position;
                                const letters =
                                  letterInputs[exercise.exercise_id] ?? [];
                                const currentLetter = letters[pos] ?? "";
                                const hasError =
                                  answerResults[exercise.exercise_id] === false;
                                const isCorrect =
                                  answerResults[exercise.exercise_id] === true;

                                return (
                                  <TextInput
                                    key={token.exercise_token_id}
                                    ref={(el) => {
                                      if (!letterInputRefs.current[exercise.exercise_id]) {
                                        letterInputRefs.current[exercise.exercise_id] = [];
                                      }
                                      letterInputRefs.current[exercise.exercise_id][pos] = el;
                                    }}
                                    style={[
                                      styles.letterBox,
                                      { width: boxWidth },
                                      isCorrect && styles.letterBoxCorrect,
                                      hasError && styles.letterBoxIncorrect,
                                    ]}
                                    maxLength={1}
                                    textAlign="center"
                                    value={currentLetter}
                                    keyboardType="default"
                                    autoCapitalize="characters"
                                    onChangeText={(text) => {
                                      const newLetters = [...letters];
                                      newLetters[pos] = text.slice(-1).toUpperCase();
                                      setLetterInputs((prev) => ({
                                        ...prev,
                                        [exercise.exercise_id]: newLetters,
                                      }));
                                      if (text.slice(-1) && pos < exerciseTokens.length - 1) {
                                        const nextRef = letterInputRefs.current[exercise.exercise_id]?.[pos + 1];
                                        if (nextRef) {
                                          nextRef.focus();
                                        }
                                      }
                                    }}
                                    onSubmitEditing={() => {
                                      if (pos < exerciseTokens.length - 1) {
                                        const nextRef = letterInputRefs.current[exercise.exercise_id]?.[pos + 1];
                                        if (nextRef) {
                                          nextRef.focus();
                                        }
                                      }
                                    }}
                                  />
                                );
                              })}
                 </View>
              );
            })()}
            {/* eslint-enable react-hooks/refs */}
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
                                    onPress={() => {
                                      setSelectedWords((prev) => ({
                                        ...prev,
                                        [exercise.exercise_id]: prev[exercise.exercise_id]?.filter(
                                          (_, i) => i !== idx,
                                        ) ?? [],
                                      }));
                                    }}
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
                      <TextInput
                        style={[
                          styles.answerInput,
                          answerResults[exercise.exercise_id] === false &&
                            styles.answerInputIncorrect,
                          answerResults[exercise.exercise_id] === true &&
                            styles.answerInputCorrect,
                        ]}
                        placeholder="Type your answer..."
                        placeholderTextColor={Colors.light.onSurfaceVariant}
                        value={submittedAnswers[exercise.exercise_id] ?? ""}
                        onChangeText={(text) =>
                          setSubmittedAnswers((prev) => ({
                            ...prev,
                            [exercise.exercise_id]: text,
                          }))
                        }
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
                        Submit
                      </ThemedText>
                    </Pressable>
                  </View>
                  {answerResults[exercise.exercise_id] === true && (
                    <ThemedText style={styles.answerCorrect}>
                      Correct!
                    </ThemedText>
                  )}
                  {answerResults[exercise.exercise_id] === false && (
                    <ThemedText style={styles.answerIncorrect}>
                      Incorrect. Try again!
                    </ThemedText>
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
                  currentExerciseIndex === exercises.length - 1 && styles.arrowButtonDisabled,
                ]}
                onPress={goToNext}
                disabled={currentExerciseIndex === exercises.length - 1}
              >
                <SymbolView
                  name={{ ios: "chevron.right", android: "arrow_forward_ios", web: "arrow_forward_ios" } as any}
                  size={28}
                  tintColor={currentExerciseIndex === exercises.length - 1 ? Colors.light.onSurfaceVariant : Colors.light.primary}
                />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {!loading && exercises.length > 1 && (
        <View style={styles.pagination}>
          {exercises.map((_, index) => (
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
    gap: 16,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  answerInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.onSurface,
  },
  answerInputCorrect: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryContainer,
  },
  answerInputIncorrect: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorContainer,
  },
  wordBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  wordBoxSelected: {
    backgroundColor: Colors.light.primaryContainer,
    borderColor: Colors.light.primary,
  },
  tokenTextSelected: {
    color: Colors.light.primary,
    fontWeight: "600",
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
    backgroundColor: Colors.light.primaryContainer,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  arrangedWordText: {
    color: Colors.light.primary,
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
    color: Colors.light.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  submitButtonTextDisabled: {
    color: Colors.light.onSurfaceVariant,
  },
  answerCorrect: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
    marginTop: 4,
  },
  answerIncorrect: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.error,
    marginTop: 4,
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
    backgroundColor: Colors.light.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.primary,
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
    backgroundColor: Colors.light.primary,
  },
  letterBoxesRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  letterBox: {
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.outlineVariant,
    fontSize: 24,
    fontWeight: "600",
    color: Colors.light.onSurface,
    backgroundColor: Colors.light.surfaceContainerLowest,
  },
  letterBoxCorrect: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryContainer,
  },
  letterBoxIncorrect: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorContainer,
  },
});
