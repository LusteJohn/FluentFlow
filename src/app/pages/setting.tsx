import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  buildReportData,
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
  const [exportingReport, setExportingReport] = useState(false);

  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      const db = await getDatabase();
      const profile = await getUserProfile(db);
      if (!profile) {
        setDialog({
          type: "error",
          title: "Export Failed",
          message: "No student profile found. Please create a profile first.",
        });
        return;
      }
      const reportData = await buildReportData(profile.user_id);

      // Build HTML for PDF
      const html = buildReportHtml(reportData, theme);

      // Lazy import to avoid native module loading during initial bundle
      const Print = await import("expo-print");
      const Sharing = await import("expo-sharing");

      const printResult: any = await Print.printAsync({
        html,
        width: 595,
        height: 842,
      });

      if (printResult?.uri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(printResult.uri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
          dialogTitle: "Share FluentFlow Report",
        });
      } else {
        setDialog({
          type: "success",
          title: "Report Generated",
          message: "PDF report has been generated successfully.",
        });
      }
    } catch (error: any) {
      setDialog({
        type: "error",
        title: "Export Failed",
        message: error?.message ?? "Failed to generate PDF report. Please try again.",
      });
    } finally {
      setExportingReport(false);
    }
  };

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
          color: theme.primary,
        },
        headerBlock: {
          alignItems: "center",
          gap: 12,
          marginBottom: 32,
        },
        headerImage: {
          width: 160,
          height: 160,
        },
        headerDescription: {
          textAlign: "center",
          color: theme.onSurfaceVariant,
          lineHeight: 20,
          paddingHorizontal: 8,
        },
        actionRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        actionImage: {
          width: 96,
          height: 96,
        },
        actionContent: {
          flex: 1,
          gap: 8,
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
        exportButton: {
          backgroundColor: theme.secondary,
          paddingVertical: 14,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 3,
          borderBottomColor: theme.secondaryContainer,
          marginTop: 12,
        },
        exportButtonPressed: {
          borderBottomWidth: 0,
          transform: [{ translateY: 3 }],
        },
        exportButtonDisabled: {
          opacity: 0.6,
        },
        exportButtonText: {
          color: theme.onSecondary,
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
          paddingVertical: 20,
        },
        dialogBackdrop: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
        },
        dialogCenter: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 400,
          maxHeight: "100%",
          zIndex: 1,
        },
        dialogCard: {
          width: "100%",
          borderRadius: 28,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 8,
          maxHeight: "90%",
          zIndex: 2,
        },
        dialogContent: {
          alignItems: "center",
          padding: 28,
          gap: 16,
        },
        dialogScroll: {
          maxHeight: 400,
          flexShrink: 1,
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
          marginTop: 16,
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 3,
          minWidth: 140,
          width: "100%",
          flexShrink: 0,
        },
        dialogButtonPressed: {
          borderBottomWidth: 0,
          transform: [{ translateY: 3 }],
        },
        dialogButtonText: {
          fontSize: 17,
          fontWeight: "700",
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

  const buildReportHtml = (reportData: any, theme: any): string => {
    const primaryColor = theme.primary;
    const secondaryColor = theme.secondary;
    const surfaceColor = theme.surfaceContainerLow;
    const onSurface = theme.onSurface;
    const onSurfaceVariant = theme.onSurfaceVariant;

    // Journey pie chart SVG
    const PIE_COLORS = [primaryColor, secondaryColor, "#168A4A", "#E6A32A", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
    const PIE_RADIUS = 70;
    const PIE_CENTER_X = 80;
    const PIE_CENTER_Y = 80;
    const PIE_STROKE = 2;

    let cumulativeAngle = -Math.PI / 2; // Start from top
    let pieSlices = "";
    const pieLegend = reportData.journeyPieData.map((j: any, i: number) => {
      const color = PIE_COLORS[i % PIE_COLORS.length];
      const sliceAngle = (j.percent / 100) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const x1 = PIE_CENTER_X + PIE_RADIUS * Math.cos(startAngle);
      const y1 = PIE_CENTER_Y + PIE_RADIUS * Math.sin(startAngle);
      const x2 = PIE_CENTER_X + PIE_RADIUS * Math.cos(endAngle);
      const y2 = PIE_CENTER_Y + PIE_RADIUS * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const pathData = `M ${PIE_CENTER_X} ${PIE_CENTER_Y} L ${x1} ${y1} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        path: pathData,
        color,
        title: j.title,
        percent: j.percent,
      };
    });

    pieSlices = pieLegend
      .map(
        (p: any) =>
          `<path d="${p.path}" fill="${p.color}" stroke="#ffffff" stroke-width="${PIE_STROKE}"/>`,
      )
      .join("");

    const pieLegendHtml = pieLegend
      .map(
        (p: any) => `
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <span style="display: inline-block; width: 12px; height: 12px; background: ${p.color}; border-radius: 3px; margin-right: 6px;"></span>
          <span style="font-size: 11px;">${p.title} (${p.percent}%)</span>
        </div>
      `,
      )
      .join("");

    const pieChartHtml = `
      <div style="display: flex; align-items: center; gap: 20px; margin: 12px 0;">
        <svg width="${PIE_CENTER_X * 2}" height="${PIE_CENTER_Y * 2}" viewBox="0 0 ${PIE_CENTER_X * 2} ${PIE_CENTER_Y * 2}">
          ${pieSlices}
        </svg>
        <div style="flex: 1;">
          ${pieLegendHtml}
        </div>
      </div>
    `;

    // Journey pie chart rows
    const journeyRows = reportData.journeyPieData
      .map(
        (j: any) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 8px; font-weight: 600;">${j.title}</td>
          <td style="padding: 8px; text-align: center;">${j.completed} / ${j.total}</td>
          <td style="padding: 8px; text-align: center;">
            <span style="display: inline-block; width: 60px; height: 12px; background: ${j.percent >= 100 ? secondaryColor : primaryColor}; border-radius: 6px; vertical-align: middle;"></span>
          </td>
          <td style="padding: 8px; text-align: center; font-weight: 600; color: ${j.percent >= 100 ? secondaryColor : primaryColor};">${j.percent}%</td>
        </tr>
      `,
      )
      .join("");

    // Weekly progress rows
    const weeklyRows = reportData.weekly
      .map(
        (w: any) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 8px; font-weight: 600;">${w.day}</td>
          <td style="padding: 8px; text-align: center;">${w.completedCount}</td>
          <td style="padding: 8px; text-align: center;">${w.xp} XP</td>
        </tr>
      `,
      )
      .join("");

    // Exercises section rows
    const exerciseRows = reportData.exercisesSection
      .map(
        (e: any) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 6px; font-size: 11px;">${e.journeyTitle}</td>
          <td style="padding: 6px; font-size: 11px;">${e.topicTitle}</td>
          <td style="padding: 6px; font-size: 11px; text-align: center; text-transform: capitalize;">${e.level}</td>
          <td style="padding: 6px; font-size: 11px; font-style: italic;">${e.exercisePrompt}</td>
          <td style="padding: 6px; font-size: 11px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: 600; background: ${e.isCorrect ? "#dcfce7" : "#fee2e2"}; color: ${e.isCorrect ? "#15803d" : "#dc2626"};">
              ${e.isCorrect ? "Correct" : "Wrong"}
            </span>
          </td>
        </tr>
      `,
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
    h1 { color: ${primaryColor}; font-size: 24px; margin-bottom: 4px; }
    h2 { color: ${primaryColor}; font-size: 18px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 4px; margin-top: 24px; }
    h3 { color: ${onSurface}; font-size: 14px; margin-top: 16px; }
    .header { text-align: center; margin-bottom: 24px; }
    .subtitle { color: ${onSurfaceVariant}; font-size: 12px; }
    .info-grid { display: flex; gap: 20px; margin: 12px 0; }
    .info-item { flex: 1; }
    .info-label { font-size: 10px; color: ${onSurfaceVariant}; text-transform: uppercase; }
    .info-value { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { background: ${surfaceColor}; padding: 8px; text-align: left; font-size: 11px; font-weight: 600; }
    td { font-size: 11px; }
    .chart-bar { display: inline-block; height: 8px; border-radius: 4px; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FluentFlow Learning Report</h1>
    <p class="subtitle">Generated on ${reportData.generatedAt}</p>
  </div>

  <h2>Student Profile</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Student Name</div>
      <div class="info-value">${reportData.studentName}</div>
    </div>
  </div>

  <h2>Weekly Progress</h2>
  <table>
    <thead>
      <tr>
        <th>Day</th>
        <th>Exercises Completed</th>
        <th>XP Earned</th>
      </tr>
    </thead>
    <tbody>
      ${weeklyRows}
    </tbody>
  </table>

<h2>Journey Progress</h2>
    ${pieChartHtml}
    <table>
    <thead>
      <tr>
        <th>Journey</th>
        <th>Completed</th>
        <th>Progress</th>
        <th>Percent</th>
      </tr>
    </thead>
    <tbody>
      ${journeyRows}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>Exercises</h2>
  <table>
    <thead>
      <tr>
        <th>Journey</th>
        <th>Topic</th>
        <th>Level</th>
        <th>Exercise</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${exerciseRows}
    </tbody>
  </table>
</body>
</html>
`;
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
          <View style={styles.headerBlock}>
            <ThemedText type="subtitle" style={styles.title}>
              Settings
            </ThemedText>
            <Image
              source={require("@/assets/images/task.jpeg")}
              style={styles.headerImage}
              resizeMode="contain"
              accessibilityLabel="Settings"
            />
            <ThemedText type="small" style={styles.headerDescription}>
              Customize how FluentFlow looks, manage the data on this device, and
              review your progress. Use Appearance to switch between light, dark,
              or system theme. Data Management lets you import learning content
              and export a PDF report of your results, while your profile,
              achievements, and streak are updated automatically as you complete
              exercises.
            </ThemedText>
          </View>

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
            <View style={styles.actionRow}>
              <Image
                source={require("@/assets/images/import.jpeg")}
                style={styles.actionImage}
                resizeMode="contain"
                accessibilityLabel="Import data"
              />
              <View style={styles.actionContent}>
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

            <View style={styles.actionRow}>
              <Image
                source={require("@/assets/images/pdf.jpeg")}
                style={styles.actionImage}
                resizeMode="contain"
                accessibilityLabel="Export PDF report"
              />
              <View style={styles.actionContent}>
                <Pressable
                  style={({ pressed }) => [
                    styles.exportButton,
                    pressed && styles.exportButtonPressed,
                    exportingReport && styles.exportButtonDisabled,
                  ]}
                  onPress={handleExportReport}
                  disabled={exportingReport}
                >
                  {exportingReport ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : null}
                  <ThemedText type="default" style={styles.exportButtonText}>
                    {exportingReport ? "Generating..." : "Export PDF Report"}
                  </ThemedText>
                </Pressable>
                <ThemedText type="small" style={styles.hint}>
                  Generate a PDF report with your profile, weekly progress,
                  journey progress, and exercise results.
                </ThemedText>
              </View>
            </View>
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
                <ScrollView style={styles.dialogScroll} showsVerticalScrollIndicator={false}>
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
                  </View>
                </ScrollView>
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
              </Animated.View>
            </View>
            </Animated.View>
          </Modal>
        )}
      </ThemedView>
    </ScreenMotion>
  );
}
