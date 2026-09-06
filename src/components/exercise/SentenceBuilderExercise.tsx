import { useMemo } from "react";

import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/contexts/theme-context";

export interface ExerciseToken {
  exercise_token_id: number;
  exercise_id: number;
  token: string;
  correct_position: number;
}

interface SentenceBuilderExerciseProps {
  tokens: ExerciseToken[];
  selectedWords: ExerciseToken[];
  answerResult?: boolean;
  onWordToggle: (token: ExerciseToken) => void;
  onWordRemove: (index: number) => void;
}

export function SentenceBuilderExercise({
  tokens,
  selectedWords,
  answerResult,
  onWordToggle,
  onWordRemove,
}: SentenceBuilderExerciseProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isCorrect = answerResult === true;

  return (
    <View style={styles.container}>
      <View style={styles.wordBoxContainer}>
        {tokens.map((token) => {
          const isSelected = selectedWords.some(
            (t) => t.exercise_token_id === token.exercise_token_id,
          );
          return (
            <Pressable
              key={token.exercise_token_id}
              style={[styles.wordBox, isSelected && styles.wordBoxSelected]}
              disabled={isCorrect}
              onPress={() => onWordToggle(token)}
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
      </View>

      {selectedWords.length > 0 && (
        <View style={styles.arrangedWordsContainer}>
          <ThemedText style={styles.arrangedWordsLabel}>
            Your sentence
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.arrangedWordsRow}
          >
            {selectedWords.map((word, idx) => (
              <Pressable
                key={`${word.exercise_token_id}-${idx}`}
                style={styles.arrangedWordBox}
                disabled={isCorrect}
                accessibilityLabel={`Remove ${word.token}`}
                accessibilityHint="Tap to remove this word from your sentence"
                onPress={() => onWordRemove(idx)}
              >
                <ThemedText style={styles.arrangedWordText}>
                  {word.token}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      width: "100%",
    },
    wordBoxContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    wordBox: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      minHeight: 48,
      backgroundColor: theme.surfaceContainerLowest,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      marginRight: 8,
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    wordBoxSelected: {
      backgroundColor: theme.secondaryContainer,
      borderColor: theme.primary,
    },
    tokenText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.onSurface,
    },
    tokenTextSelected: {
      color: theme.primary,
      fontWeight: "600",
    },
    arrangedWordsContainer: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      backgroundColor: theme.surfaceContainerLow,
    },
    arrangedWordsLabel: {
      color: theme.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
    },
    arrangedWordsRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    arrangedWordBox: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
      backgroundColor: "#fff4e5",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.secondaryContainer,
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    arrangedWordText: {
      color: "#6f5100",
      fontSize: 16,
      fontWeight: "500",
    },
  });
}
