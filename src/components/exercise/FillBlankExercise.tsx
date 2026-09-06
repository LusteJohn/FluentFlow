import { useMemo } from "react";

import { StyleSheet, TextInput, View } from "react-native";

import { useTheme } from "@/contexts/theme-context";

export interface ExerciseToken {
  exercise_token_id: number;
  exercise_id: number;
  token: string;
  correct_position: number;
}

interface FillBlankExerciseProps {
  value: string;
  onChangeText: (text: string) => void;
  answerResult?: boolean;
}

export function FillBlankExercise({
  value,
  onChangeText,
  answerResult,
}: FillBlankExerciseProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isCorrect = answerResult === true;
  const hasError = answerResult === false;

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.answerInput,
          isCorrect && styles.answerInputCorrect,
          hasError && styles.answerInputIncorrect,
        ]}
        placeholder="Type your answer..."
        placeholderTextColor={theme.onSurfaceVariant}
        accessibilityLabel="Answer"
        accessibilityHint="Enter the missing word"
        value={value}
        onChangeText={onChangeText}
        editable={answerResult !== true}
        autoCapitalize="sentences"
        autoCorrect={false}
        returnKeyType="done"
        blurOnSubmit
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      width: "100%",
    },
    answerInput: {
      width: "100%",
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 54,
      fontSize: 16,
      lineHeight: 22,
      color: theme.onSurface,
      backgroundColor: theme.surfaceContainerLowest,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    answerInputCorrect: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer,
    },
    answerInputIncorrect: {
      borderColor: theme.error,
      backgroundColor: theme.errorContainer,
    },
  });
}
