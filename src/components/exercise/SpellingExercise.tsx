import {
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import { Colors } from "@/constants/theme";

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
            onSubmitEditing={() => focusNext(pos)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  letterBoxesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  letterBox: {
    width: 48,
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
    borderColor: "#22c55e",
    backgroundColor: "#dcfce7",
  },
  letterBoxIncorrect: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorContainer,
  },
});
