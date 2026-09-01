import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { getDatabase, importJourneyData, importTopicData, importTopicIntroData, importTopicVocabularyData, importExerciseData, importExerciseTokenData } from "@/database/database";
import { seedUserLevelProgress } from "@/backend/UserLevelProgress";
import AlertDialog from "@/components/alert-dialog";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

export default function SettingsPage() {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | {
    type: "success" | "error";
    title: string;
    message: string;
  }>(null);
  const [loading, setLoading] = useState(false);

  const closeDialog = () => setDialog(null);

  const handleImportData = async () => {
    setLoading(true);
    try {
      const db = await getDatabase();

      await importJourneyData();
      const journeyCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM journeys");

      await importTopicData();
      const topicCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM topics");

      await importTopicIntroData();
      const topicIntroCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM topic_introduction");

      await importTopicVocabularyData();
      const topicVocabCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM topic_vocabulary");

      await importExerciseData();
      const exerciseCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM exercises");

      await importExerciseTokenData();
      const tokenCount = await db.getFirstAsync("SELECT COUNT(*) as count FROM exercise_tokens");

      await seedUserLevelProgress(db);

      setDialog({
        type: "success",
        title: "Import Succeeded",
        message:
          `Imported data successfully:\n\n` +
          `Journeys: ${journeyCount?.count ?? 0}\n` +
          `Topics: ${topicCount?.count ?? 0}\n` +
          `Topic Introductions: ${topicIntroCount?.count ?? 0}\n` +
          `Topic Vocabulary: ${topicVocabCount?.count ?? 0}\n` +
          `Exercises: ${exerciseCount?.count ?? 0}\n` +
          `Exercise Tokens: ${tokenCount?.count ?? 0}`,
      });
    } catch (error: any) {
      setDialog({
        type: "error",
        title: "Import Failed",
        message:
          error?.message ?? "Failed to import data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          Settings
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Data Management
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleImportData}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={Colors.light.onPrimary}
              />
            ) : null}
            <ThemedText type="default" style={styles.buttonText}>
              {loading ? "Importing..." : "Import All Data"}
            </ThemedText>
          </Pressable>
          <ThemedText type="small" style={styles.hint}>
            This will import journey, topic, topic intro, topic vocabulary, exercise, and exercise token data into the database.
          </ThemedText>
        </View>
      </View>
      <NavBar />

      {dialog && (
        <AlertDialog
          visible={true}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          onConfirm={closeDialog}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
    color: Colors.light.primary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.light.onSurface,
    marginBottom: 4,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
  },
  buttonPressed: {
    borderBottomWidth: 0,
    transform: [{ translateY: 3 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    color: Colors.light.onSurfaceVariant,
    marginTop: 4,
  },
});
