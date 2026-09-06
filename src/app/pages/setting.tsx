import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { seedUserLevelProgress } from "@/backend/UserLevelProgress";
import AlertDialog from "@/components/alert-dialog";
import { ScreenMotion } from "@/components/screen-motion";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme, useThemeMode } from "@/contexts/theme-context";
import {
    getDatabase,
    importExerciseData,
    importExerciseTokenData,
    importJourneyData,
    importTopicData,
    importTopicIntroData,
    importTopicVocabularyData,
} from "@/database/database";
import AppHeader from "../(tabs)/header";
import NavBar from "../(tabs)/navBar";

const THEME_OPTIONS: { label: string; value: "light" | "dark" | "system" }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function SettingsPage() {
  const theme = useTheme();
  const { mode: themeMode, setMode } = useThemeMode();
  const [dialog, setDialog] = useState<null | {
    type: "success" | "error";
    title: string;
    message: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.surface,
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
          color: theme.primary,
        },
        section: {
          gap: 12,
          marginBottom: 24,
        },
        sectionTitle: {
          color: theme.onSurface,
          marginBottom: 4,
        },
        themeRow: {
          flexDirection: "row",
          gap: 12,
        },
        themeChip: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: theme.outlineVariant,
          backgroundColor: theme.surfaceContainerLow,
        },
        themeChipText: {
          color: theme.onSurface,
        },
        button: {
          backgroundColor: theme.primary,
          paddingVertical: 14,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 3,
          borderBottomColor: theme.primaryContainer,
        },
        buttonPressed: {
          borderBottomWidth: 0,
          transform: [{ translateY: 3 }],
        },
        buttonDisabled: {
          opacity: 0.6,
        },
        buttonText: {
          color: theme.onPrimary,
          fontSize: 16,
          fontWeight: "600",
        },
        hint: {
          color: theme.onSurfaceVariant,
          marginTop: 4,
        },
      }),
    [theme],
  );

  const closeDialog = () => setDialog(null);

  const handleImportData = async () => {
    setLoading(true);
    try {
      const db = await getDatabase();

      await importJourneyData();
      const journeyCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM journeys",
      );

      await importTopicData();
      const topicCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM topics",
      );

      await importTopicIntroData();
      const topicIntroCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM topic_introduction",
      );

      await importTopicVocabularyData();
      const topicVocabCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM topic_vocabulary",
      );

      await importExerciseData();
      const exerciseCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM exercises",
      );

      await importExerciseTokenData();
      const tokenCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM exercise_tokens",
      );

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
        message: error?.message ?? "Failed to import data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (value: "light" | "dark" | "system") => {
    setSavingTheme(true);
    try {
      await setMode(value);
    } catch (e) {
      console.warn("Failed to set theme", e);
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <ScreenMotion>
      <ThemedView style={styles.container}>
        <AppHeader />
        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.title}>
            Settings
          </ThemedText>

          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Appearance
            </ThemedText>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((option) => {
                const selected = themeMode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.themeChip,
                      selected && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => handleThemeChange(option.value)}
                    disabled={savingTheme}
                  >
                    <ThemedText
                      type="small"
                      style={[
                        styles.themeChipText,
                        selected && {
                          color: theme.onPrimary,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

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
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : null}
              <ThemedText type="default" style={styles.buttonText}>
                {loading ? "Importing..." : "Import All Data"}
              </ThemedText>
            </Pressable>
            <ThemedText type="small" style={styles.hint}>
              This will import journey, topic, topic intro, topic vocabulary,
              exercise, and exercise token data into the database.
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
    </ScreenMotion>
  );
}
