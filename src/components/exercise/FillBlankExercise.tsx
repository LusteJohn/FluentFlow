import { StyleSheet, TextInput, View } from "react-native";

import { Colors } from "@/constants/theme";

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
        placeholderTextColor={Colors.light.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        editable={answerResult !== true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  answerInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.onSurface,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  answerInputCorrect: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryContainer,
  },
  answerInputIncorrect: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorContainer,
  },
});
