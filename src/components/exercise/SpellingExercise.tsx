import { useMemo } from "react";

import { ScrollView, StyleSheet, TextInput } from "react-native";

import { useTheme } from "@/contexts/theme-context";

export interface ExerciseToken {
  exercise_token_id: number;
  exercise_id: number;
  token: string;
  correct_position: number;
}

interface SpellingExerciseProps {
  tokens: ExerciseToken[];
  letters: string[];
  answerResult?: boolean;
  letterRefs: React.MutableRefObject<Record<number, (TextInput | null)[]>>;
  exerciseId: number;
  onLetterChange: (pos: number, value: string) => void;
}

export function SpellingExercise({
  tokens,
  letters,
  answerResult,
  letterRefs,
  exerciseId,
  onLetterChange,
}: SpellingExerciseProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isCorrect = answerResult === true;
  const hasError = answerResult === false;

  const focusNext = (pos: number) => {
    if (pos < tokens.length - 1) {
      const nextRef = letterRefs.current[exerciseId]?.[pos + 1];
      if (nextRef) {
        nextRef.focus();
      }
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.letterBoxesRow}
    >
      {tokens.map((token) => {
        const pos = token.correct_position;
        const currentLetter = letters[pos] ?? "";

        return (
          <TextInput
            key={token.exercise_token_id}
            ref={(el) => {
              if (!letterRefs.current[exerciseId]) {
                letterRefs.current[exerciseId] = [];
              }
              letterRefs.current[exerciseId][pos] = el;
            }}
            style={[
              styles.letterBox,
              isCorrect && styles.letterBoxCorrect,
              hasError && styles.letterBoxIncorrect,
            ]}
            accessibilityLabel={`Letter ${pos + 1}`}
            accessibilityHint="Enter one letter, then the next box will be selected"
            maxLength={1}
            textAlign="center"
            value={currentLetter}
            keyboardType="default"
            autoCapitalize="characters"
            editable={!isCorrect}
            onChangeText={(text) => {
              const value = text.slice(-1).toUpperCase();
              onLetterChange(pos, value);
              if (value && pos < tokens.length - 1) {
                focusNext(pos);
              }
            }}
            returnKeyType={pos < tokens.length - 1 ? "next" : "done"}
            onSubmitEditing={() => focusNext(pos)}
          />
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    letterBoxesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
      paddingRight: 8,
    },
    letterBox: {
      width: 48,
      height: 56,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.outlineVariant,
      fontSize: 24,
      fontWeight: "600",
      color: theme.onSurface,
      backgroundColor: theme.surfaceContainerLowest,
    },
    letterBoxCorrect: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer,
    },
    letterBoxIncorrect: {
      borderColor: theme.error,
      backgroundColor: theme.errorContainer,
    },
  });
}
