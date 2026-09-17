import { useMemo, useState } from "react";

import { ScrollView, StyleSheet, TextInput, View } from "react-native";

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

const LETTER_BOX_MIN_WIDTH = 34;
const LETTER_BOX_MAX_WIDTH = 52;
const LETTER_BOX_GAP = 6;
const LETTER_BOX_HORIZONTAL_PADDING = 16;
const SINGLE_ROW_WORD_LIMIT = 7;

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
  const letterCount = Math.max(tokens.length, 1);
  const [containerWidth, setContainerWidth] = useState(0);

  const focusNext = (pos: number) => {
    if (pos >= tokens.length - 1) return;
    const nextRef = letterRefs.current[exerciseId]?.[pos + 1];
    if (nextRef) {
      nextRef.focus();
    }
  };

  const getLetterBoxWidth = () => {
    const availableWidth = Math.max(containerWidth, 0);
    const boxWidth =
      (availableWidth - LETTER_BOX_GAP * (letterCount - 1)) / letterCount;
    return Math.max(
      LETTER_BOX_MIN_WIDTH,
      Math.min(LETTER_BOX_MAX_WIDTH, boxWidth),
    );
  };

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0) {
          setContainerWidth(nextWidth);
        }
      }}
      style={styles.container}
    >
      <ScrollView
        horizontal={letterCount > SINGLE_ROW_WORD_LIMIT}
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
                { width: getLetterBoxWidth() },
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
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      width: "100%",
    },
    letterBoxesRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: LETTER_BOX_GAP,
      paddingHorizontal: LETTER_BOX_HORIZONTAL_PADDING,
      paddingVertical: 4,
    },
    letterBox: {
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
