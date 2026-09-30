import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutDown,
} from "react-native-reanimated";
import { SymbolView } from "expo-symbols";

import { ScreenMotion } from "@/components/screen-motion";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme, useThemeMode } from "@/contexts/theme-context";
import {
  getCompletedTopicLevels,
  getDatabase,
  importExerciseData,
  importExerciseTokenData,
  importGrammarTriviaData,
  importJourneyData,
  importTopicData,
  importTopicIntroData,
  importTopicVocabularyData,
  importUserExerciseProgressData,
  importUserProfileData,
  importUserStreaksData,
  resetTopicLevel,
} from "@/database/database";
import { getUserProfile } from "@/backend/UserProfile";
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
  const [topicLevels, setTopicLevels] = useState<any[]>([]);
  const [loadingTopicLevels, setLoadingTopicLevels] = useState(false);
  const [resettingTopicId, setResettingTopicId] = useState<number | null>(null);
  const [resettingLevel, setResettingLevel] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmTopicId, setConfirmTopicId] = useState<number | null>(null);
  const [confirmLevel, setConfirmLevel] = useState<string | null>(null);
  const [confirmTopicTitle, setConfirmTopicTitle] = useState<string>("");

  const closeDialog = () => setDialog(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.surface,
        },
        sv: {
          flex: 1,
        },
        content: {
          paddingHorizontal: 24,
          paddingVertical: 32,
          maxWidth: 448,
          alignSelf: "center",
          width: "100%",
          paddingBottom: 160,
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
        version: {
          color: theme.onSurfaceVariant,
          marginTop: 4,
        },
        hint: {
          color: theme.onSurfaceVariant,
          marginTop: 4,
        },
        topicList: {
          maxHeight: 300,
          marginTop: 4,
        },
        topicItem: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
          backgroundColor: theme.surfaceContainerLow,
          borderRadius: 10,
          marginBottom: 8,
        },
        topicInfo: {
          flex: 1,
          marginRight: 12,
        },
        topicTitle: {
          color: theme.onSurface,
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 2,
        },
        topicMeta: {
          color: theme.onSurfaceVariant,
          fontSize: 12,
        },
        resetButton: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: theme.errorContainer,
          minWidth: 70,
          alignItems: "center",
        },
        resetButtonDisabled: {
          opacity: 0.6,
        },
        resetButtonText: {
          color: theme.onErrorContainer,
          fontSize: 13,
          fontWeight: "600",
        },
        dialogOverlay: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        },
        dialogBackdrop: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
        },
        dialogCenter: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 400,
        },
        dialogCard: {
          width: "100%",
          borderRadius: 28,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 8,
        },
        dialogContent: {
          alignItems: "center",
          padding: 28,
          gap: 16,
        },
        dialogTitle: {
          textAlign: "center",
          fontSize: 22,
          fontWeight: "600",
          lineHeight: 28,
        },
        dialogMessage: {
          textAlign: "center",
          fontSize: 15,
          lineHeight: 22,
        },
        dialogButton: {
          marginTop: 8,
          paddingVertical: 14,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 3,
          minWidth: 120,
          width: "100%",
        },
        dialogButtonPressed: {
          borderBottomWidth: 0,
          transform: [{ translateY: 3 }],
        },
        dialogButtonText: {
          fontSize: 16,
          fontWeight: "600",
          lineHeight: 22,
        },
        confirmButtonRow: {
          flexDirection: "row",
          gap: 12,
          marginTop: 8,
        },
        confirmButton: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0, 0, 0, 0.08)",
        },
        confirmButtonPressed: {
          borderBottomWidth: 0,
          transform: [{ translateY: 3 }],
        },
        confirmButtonText: {
          fontSize: 16,
          fontWeight: "600",
          lineHeight: 22,
        },
      }),
    [theme],
  );

  const loadTopicLevels = async () => {
    setLoadingTopicLevels(true);
    try {
      const db = await getDatabase();
      const profile = await getUserProfile(db);
      if (!profile) return;
      const rows = await getCompletedTopicLevels(profile.user_id);
      setTopicLevels(rows);
    } catch (error) {
      console.error("Failed to load completed topic levels", error);
    } finally {
      setLoadingTopicLevels(false);
    }
};
 
  const handleResetTopicLevel = (topicId: number, level: string, topicTitle: string) => {
    setConfirmTopicId(topicId);
    setConfirmLevel(level);
    setConfirmTopicTitle(topicTitle);
    setShowConfirmDialog(true);
  };
 
  const confirmReset = async () => {
    if (confirmTopicId === null || confirmLevel === null) return;
    setShowConfirmDialog(false);
    setResettingTopicId(confirmTopicId);
    setResettingLevel(confirmLevel);
    try {
      const db = await getDatabase();
      const profile = await getUserProfile(db);
      if (!profile) return;
      await resetTopicLevel(profile.user_id, confirmTopicId, confirmLevel);
      await loadTopicLevels();
      setDialog({
        type: "success",
        title: "Reset Complete",
        message: `"${confirmTopicTitle}" (${confirmLevel}) has been reset. You can start it again from scratch.`,
      });
    } catch (error: any) {
      setDialog({
        type: "error",
        title: "Reset Failed",
        message: error?.message ?? "Failed to reset topic level. Please try again.",
      });
    } finally {
      setResettingTopicId(null);
      setResettingLevel(null);
      setConfirmTopicId(null);
      setConfirmLevel(null);
      setConfirmTopicTitle("");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTopicLevels();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

       await importGrammarTriviaData();
      const triviaCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM grammar_trivia",
      );

      await importUserProfileData();
      const profileCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM user_profiles",
      );

      await importUserExerciseProgressData();
      const exerciseProgressCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM user_exercise_progress",
      );

      await importUserStreaksData();
      const streakCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM user_streaks",
      );

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
          `Exercise Tokens: ${tokenCount?.count ?? 0}\n` +
          `Grammar Trivia: ${triviaCount?.count ?? 0}\n` +
          `User Profiles: ${profileCount?.count ?? 0}\n` +
          `User Exercise Progress: ${exerciseProgressCount?.count ?? 0}\n` +
          `User Streaks: ${streakCount?.count ?? 0}`,
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
        <ScrollView
          style={styles.sv}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
              About App
            </ThemedText>
            <ThemedText type="small" style={styles.version}>
              FluentFlow · Version 1.1.2
            </ThemedText>
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

          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Reset Topic Levels
            </ThemedText>
            {loadingTopicLevels ? (
              <ThemedText style={styles.hint}>Loading completed topics...</ThemedText>
            ) : topicLevels.length === 0 ? (
              <ThemedText style={styles.hint}>
                No completed topic levels yet. Complete a topic level to see it here.
              </ThemedText>
            ) : (
              <ScrollView style={styles.topicList} nestedScrollEnabled>
                {topicLevels.map((row) => {
                  const isResetting =
                    resettingTopicId === row.topic_id && resettingLevel === row.level;
                  return (
                    <View key={`${row.topic_id}-${row.level}`} style={styles.topicItem}>
                      <View style={styles.topicInfo}>
                        <ThemedText style={styles.topicTitle}>
                          {row.topic_title}
                        </ThemedText>
                        <ThemedText style={styles.topicMeta}>
                          {row.journey_title ?? "Unknown Journey"} · {row.level} ·{" "}
                          {row.completed_count} exercises completed
                          {row.topic_achieved_at ? " · Achievement earned" : ""}
                        </ThemedText>
                      </View>
                      <Pressable
                        style={[
                          styles.resetButton,
                          isResetting && styles.resetButtonDisabled,
                        ]}
                        disabled={isResetting}
                        onPress={() =>
                          handleResetTopicLevel(
                            row.topic_id,
                            row.level,
                            row.topic_title,
                          )
                        }
                      >
                        <ThemedText style={styles.resetButtonText}>
                          {isResetting ? "Resetting..." : "Reset"}
                        </ThemedText>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}
            <ThemedText type="small" style={styles.hint}>
              Resetting a topic level deletes your exercise answers, progress,
              and topic achievement for that level. You can start it again
              from scratch.
            </ThemedText>
          </View>
        </ScrollView>
        <NavBar />

        {showConfirmDialog && (
          <Modal
            visible={true}
            transparent
            animationType="none"
            onRequestClose={() => setShowConfirmDialog(false)}
          >
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={styles.dialogOverlay}
            >
              <Pressable
                style={styles.dialogBackdrop}
                onPress={() => setShowConfirmDialog(false)}
              />
            </Animated.View>
            <View style={styles.dialogCenter}>
              <Animated.View
                entering={FadeInUp.duration(250).springify().delay(100)}
                exiting={FadeOutDown.duration(200)}
                style={[
                  styles.dialogCard,
                  {
                    backgroundColor: theme.surfaceContainerHigh,
                    shadowColor: theme.onSurface,
                  },
                ]}
              >
                <View style={styles.dialogContent}>
                  <SymbolView
                    name={{
                      ios: "exclamationmark.triangle.fill",
                      android: "warning",
                      web: "warning",
                    }}
                    size={64}
                    tintColor={theme.tertiary}
                  />
                  <ThemedText
                    type="subtitle"
                    style={[styles.dialogTitle, { color: theme.onSurface }]}
                  >
                    Reset Topic Level
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.dialogMessage, { color: theme.onSurfaceVariant }]}
                  >
                    {`Are you sure you want to reset "${confirmTopicTitle}" (${confirmLevel})?` +
                      "\n\n" +
                      "This will delete your exercise answers, progress, and topic achievement for this level. You can start it again from scratch."}
                  </ThemedText>
                  <View style={styles.confirmButtonRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.confirmButtonPressed,
                      ]}
                      onPress={() => setShowConfirmDialog(false)}
                    >
                      <ThemedText
                        style={[
                          styles.confirmButtonText,
                          { color: theme.onSurfaceVariant },
                        ]}
                      >
                        Cancel
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.confirmButton,
                        {
                          backgroundColor: theme.errorContainer,
                          borderBottomColor: `${theme.error}cc`,
                        },
                        pressed && styles.confirmButtonPressed,
                      ]}
                      onPress={confirmReset}
                    >
                      <ThemedText
                        style={[
                          styles.confirmButtonText,
                          { color: theme.onErrorContainer },
                        ]}
                      >
                        Reset
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </View>
          </Modal>
        )}

        {dialog && (
          <Modal
            visible={true}
            transparent
            animationType="none"
            onRequestClose={closeDialog}
          >
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={styles.dialogOverlay}
            >
              <Pressable
                style={styles.dialogBackdrop}
                onPress={closeDialog}
              />
            </Animated.View>
            <View style={styles.dialogCenter}>
              <Animated.View
                entering={FadeInUp.duration(250).springify().delay(100)}
                exiting={FadeOutDown.duration(200)}
                style={[
                  styles.dialogCard,
                  {
                    backgroundColor: theme.surfaceContainerHigh,
                    shadowColor: theme.onSurface,
                  },
                ]}
              >
                <View style={styles.dialogContent}>
                  <SymbolView
                    name={
                      dialog.type === "success"
                        ? {
                            ios: "checkmark.circle.fill",
                            android: "check_circle",
                            web: "check_circle",
                          }
                        : {
                            ios: "xmark.circle.fill",
                            android: "error",
                            web: "error",
                          }
                    }
                    size={64}
                    tintColor={
                      dialog.type === "success" ? "#1ca65a" : theme.error
                    }
                  />
                  <ThemedText
                    type="subtitle"
                    style={[styles.dialogTitle, { color: theme.onSurface }]}
                  >
                    {dialog.title}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[styles.dialogMessage, { color: theme.onSurfaceVariant }]}
                  >
                    {dialog.message}
                  </ThemedText>
                  <Pressable
                    style={({ pressed }) => [
                      styles.dialogButton,
                      {
                        backgroundColor:
                          dialog.type === "success" ? "#1ca65a" : theme.error,
                        borderBottomColor:
                          dialog.type === "success"
                            ? "#1ca65acc"
                            : `${theme.error}cc`,
                      },
                      pressed && styles.dialogButtonPressed,
                    ]}
                    onPress={closeDialog}
                  >
                    <ThemedText
                      style={[
                        styles.dialogButtonText,
                        { color: theme.onPrimary },
                      ]}
                    >
                      OK
                    </ThemedText>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </Modal>
        )}
      </ThemedView>
    </ScreenMotion>
  );
}
