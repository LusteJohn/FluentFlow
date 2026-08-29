import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

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
              style={[
                styles.wordBox,
                isSelected && styles.wordBoxSelected,
              ]}
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  wordBoxSelected: {
    backgroundColor: Colors.light.secondaryContainer,
    borderColor: Colors.light.primary,
  },
  tokenText: {
    fontSize: 14,
    color: Colors.light.onSurface,
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
});
