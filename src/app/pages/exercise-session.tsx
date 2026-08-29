import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { getExerciseTokensByExerciseId } from "@/backend/ExerciseTokens";
import { getExerciseById } from "@/backend/TopicExercise";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getDatabase } from "@/database/database";
import AppHeader from "../(tabs)/header";
import NavBar from "../(tabs)/navBar";

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

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function extractAnswerFromContext(context: string): string | null {
  const match = context.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

export default function ExerciseSessionPage() {
  const { exercise_id } = useLocalSearchParams<{
    exercise_id: string;
  }>();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [allTokens, setAllTokens] = useState<ExerciseToken[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<ExerciseToken[]>([]);
  const [spellingAnswer, setSpellingAnswer] = useState("");
  const [referenceItems, setReferenceItems] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        // Reset state up front so switching between exercises never shows
        // stale data (previous exercise's tokens/prompt) while the new
        // exercise is still loading.
        if (isActive) {
          setExercise(null);
          setAllTokens([]);
          setSelectedTokens([]);
          setSpellingAnswer("");
          setReferenceItems([]);
        }

        try {
          const db = await getDatabase();
          const exId = parseInt(exercise_id ?? "1", 10);

          const exo = (await getExerciseById(db, exId)) as Exercise | null;
          if (isActive) {
            setExercise(exo);
          }

          const tokens =
            ((await getExerciseTokensByExerciseId(
              db,
              exId,
            )) as ExerciseToken[]) ?? [];
          if (isActive) {
            setAllTokens(shuffleArray(tokens));
          }

          // Build a stable (computed once, not re-shuffled on every render)
          // reference hint so the student always has something to go on,
          // regardless of exercise type.
          if (isActive && exo) {
            if (exo.type === "spelling") {
              // one token per letter already - just show them as a shuffled bank
              setReferenceItems(shuffleArray(tokens.map((t) => t.token)));
            } else if (exo.type === "fill_blank_spelling") {
              // fill_blank_spelling stores the whole answer as a single token
              const raw = tokens[0]?.token ?? "";
              const words = raw.trim().split(/\s+/).filter(Boolean);
              setReferenceItems(
                words.length > 1
                  ? shuffleArray(words)
                  : shuffleArray(raw.split("")),
              );
            } else {
              setReferenceItems([]);
            }
          }
        } catch (error) {
          console.error("Failed to load exercise session", error);
        }
      }

      loadData();

      return () => {
        isActive = false;
      };
    }, [exercise_id]),
  );

  const handleSelectToken = (token: ExerciseToken) => {
    const alreadySelected = selectedTokens.some(
      (t) => t.exercise_token_id === token.exercise_token_id,
    );
    if (alreadySelected) return;
    setSelectedTokens((prev) => [...prev, token]);
  };

  const handleDeselectToken = (token: ExerciseToken) => {
    setSelectedTokens((prev) =>
      prev.filter((t) => t.exercise_token_id !== token.exercise_token_id),
    );
  };

  const handleCheck = () => {
    if (!exercise) return;

    if (exercise.type === "sentence_builder") {
      const isCorrect =
        selectedTokens.length === allTokens.length &&
        selectedTokens.every(
          (token, index) => token.correct_position === index,
        );

      if (isCorrect) {
        router.back();
      } else {
        setSelectedTokens([]);
        setAllTokens(shuffleArray(allTokens));
      }
    } else if (exercise.type === "fill_blank_spelling") {
      const answer =
        correctAnswerFromTokens() ??
        (exercise.context_sentence
          ? extractAnswerFromContext(exercise.context_sentence)
          : null);
      const isCorrect =
        answer !== null &&
        spellingAnswer.trim().toLowerCase() === answer.toLowerCase();

      if (isCorrect) {
        router.back();
      }
    } else if (exercise.type === "spelling") {
      const answer = correctAnswerFromTokens();
      const isCorrect =
        answer !== null &&
        spellingAnswer.trim().toLowerCase() === answer.toLowerCase();

      if (isCorrect) {
        router.back();
      }
    }
  };

  const isCheckDisabled =
    exercise?.type === "sentence_builder"
      ? selectedTokens.length === 0
      : spellingAnswer.trim().length === 0;

  const isTokenSelected = (token: ExerciseToken) =>
    selectedTokens.some((t) => t.exercise_token_id === token.exercise_token_id);

  const correctAnswerFromTokens = (): string | null => {
    if (allTokens.length === 0) return null;
    const sorted = [...allTokens].sort(
      (a, b) => a.correct_position - b.correct_position,
    );
    return sorted.map((t) => t.token).join("");
  };

  const renderSentenceBuilder = () => (
    <>
      <View
        style={[
          styles.workspace,
          selectedTokens.length === 0 && styles.workspaceEmpty,
        ]}
      >
        {selectedTokens.length === 0 ? (
          <ThemedText style={styles.workspacePlaceholder}>
            Select words below...
          </ThemedText>
        ) : (
          <View style={styles.selectedWordsRow}>
            {selectedTokens.map((token) => (
              <Pressable
                key={token.exercise_token_id}
                style={styles.selectedWordChip}
                onPress={() => handleDeselectToken(token)}
              >
                <ThemedText style={styles.selectedWordText}>
                  {token.token}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.wordBank}>
        {allTokens.map((token) => {
          const isSelected = isTokenSelected(token);
          return (
            <Pressable
              key={token.exercise_token_id}
              style={[styles.wordChip, isSelected && styles.wordChipSelected]}
              onPress={() => handleSelectToken(token)}
              disabled={isSelected}
            >
              <ThemedText
                style={[
                  styles.wordChipText,
                  isSelected && styles.wordChipTextDisabled,
                ]}
              >
                {token.token}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  const renderTextInput = () => {
    const placeholder = "Type your answer";

    return (
      <View style={styles.textInputContainer}>
        {exercise?.context_sentence && (
          <ThemedText style={styles.contextSentence}>
            {exercise.context_sentence}
          </ThemedText>
        )}
        <TextInput
          style={styles.textInput}
          value={spellingAnswer}
          onChangeText={setSpellingAnswer}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.onSurfaceVariant}
          autoCapitalize="none"
        />
        {referenceItems.length > 0 && (
          <View style={styles.referenceContainer}>
            <ThemedText style={styles.referenceLabel}>
              {exercise?.type === "spelling"
                ? "Letters to use:"
                : "Words to use:"}
            </ThemedText>
            <View style={styles.referenceRow}>
              {referenceItems.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.referenceChip}>
                  <ThemedText style={styles.referenceChipText}>
                    {item}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader />

      <View style={styles.simpleTopBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <SymbolView
            name={
              {
                ios: "chevron.left",
                android: "arrow_back_ios",
                web: "arrow_back_ios",
              } as any
            }
            size={28}
            tintColor={Colors.light.onSurface}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <View style={styles.topicIconContainer}>
            <SymbolView
              name={
                {
                  ios: "book.fill",
                  android: "menu_book",
                  web: "menu_book",
                } as any
              }
              size={40}
              tintColor={Colors.light.primary}
            />
          </View>
          <ThemedText style={styles.screenTitle}>
            {exercise?.type === "sentence_builder"
              ? "Sentence Builder"
              : exercise?.type === "fill_blank_spelling"
                ? "Fill in the Blank"
                : "Spelling"}
          </ThemedText>
          <ThemedText style={styles.screenDescription}>
            {exercise?.prompt ??
              (exercise?.type === "sentence_builder"
                ? "Tap the words to put them in the correct order."
                : "Type the correct answer below.")}
          </ThemedText>
        </View>

        {exercise?.type === "sentence_builder"
          ? renderSentenceBuilder()
          : renderTextInput()}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.checkButton,
            isCheckDisabled && styles.checkButtonDisabled,
          ]}
          onPress={handleCheck}
          disabled={isCheckDisabled}
        >
          <ThemedText
            style={[
              styles.checkButtonText,
              isCheckDisabled && styles.checkButtonTextDisabled,
            ]}
          >
            Check
          </ThemedText>
        </Pressable>
      </View>
      <NavBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  simpleTopBar: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
    gap: 24,
  },
  headerSection: {
    alignItems: "center",
    gap: 12,
  },
  topicIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.light.surfaceContainerLowest,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  screenTitle: {
    color: Colors.light.onSurface,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  screenDescription: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  workspace: {
    minHeight: 120,
    width: "100%",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.light.outlineVariant,
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.light.surfaceContainerLowest,
  },
  workspaceEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  workspacePlaceholder: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.5,
    textAlign: "center",
  },
  selectedWordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  selectedWordChip: {
    backgroundColor: Colors.light.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primary,
  },
  selectedWordText: {
    color: Colors.light.onPrimaryContainer,
    fontSize: 14,
    fontWeight: "600",
  },
  wordBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  wordChip: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  wordChipSelected: {
    backgroundColor: Colors.light.surfaceContainerLow,
    opacity: 0.5,
  },
  wordChipText: {
    color: Colors.light.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  wordChipTextDisabled: {
    color: Colors.light.onSurfaceVariant,
    opacity: 0.5,
  },
  textInputContainer: {
    gap: 16,
    alignItems: "center",
  },
  contextSentence: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  textInput: {
    width: "100%",
    maxWidth: 280,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.outlineVariant,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.onSurface,
    textAlign: "center",
  },
  referenceContainer: {
    width: "100%",
    maxWidth: 280,
    gap: 8,
    alignItems: "center",
  },
  referenceLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
  },
  referenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  referenceChip: {
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  referenceChipText: {
    color: Colors.light.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 16,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
  },
  checkButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
  },
  checkButtonDisabled: {
    backgroundColor: Colors.light.surfaceVariant,
    borderBottomColor: Colors.light.outline,
  },
  checkButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  checkButtonTextDisabled: {
    color: Colors.light.onSurfaceVariant,
    opacity: 0.5,
  },
});
