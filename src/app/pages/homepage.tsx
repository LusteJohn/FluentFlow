import { BackHandler, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import AlertDialog from "@/components/alert-dialog";
import TutorialModal, { getWelcomingPhrase } from "@/components/tutorial-modal";
import { getDatabase, isDataImported, hasSeenTutorial, markTutorialSeen } from "@/database/database";
import { getUserProfile } from "@/backend/UserProfile";
import { getWeeklyProgress, getWeeklyProgressDetails, getRecentCompletedExercises, getRecentCompletedExercisesCount, getTotalEarnedXP } from "@/backend/UserExerciseProgress";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

interface StatCard {
  id: string;
  value: string;
  label: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

interface WeeklyBar {
  day: string;
  height: number;
  dayIndex: number;
}

interface DayDetailItem {
  id: number;
  recorded_at: string;
  exercise_id: number;
  level: string;
  type: string;
  title: string;
  xp: number;
  topic_id: number;
  topic_title: string;
  grammar_focus: string;
}

interface RecentExercise {
  id: string;
  type: string;
  typeIcon: any;
  typeIconBg: string;
  typeIconColor: string;
  title: string;
  status: "Completed" | "In Progress";
  statusIcon: any;
  statusColor: string;
  xp: string;
  xpColor: string;
}

const STAT_CARDS: StatCard[] = [
  {
    id: "1",
    value: "7",
    label: "Day Streak",
    icon: { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" },
    iconBg: Colors.light.surface,
    iconColor: Colors.light.tertiary,
  },
  {
    id: "2",
    value: "245",
    label: "Words",
    icon: { ios: "book.fill", android: "menu_book", web: "menu_book" },
    iconBg: Colors.light.surface,
    iconColor: Colors.light.primary,
  },
  {
    id: "3",
    value: "1.2k",
    label: "Total XP",
    icon: { ios: "star.fill", android: "stars", web: "stars" },
    iconBg: Colors.light.surface,
    iconColor: Colors.light.secondary,
  },
];

const DAY_LABELS = ["Su", "M", "T", "W", "Th", "F", "Sa"];

const XP_COLOR = "#16a34a";
const XP_CHIP_BG = "#dcfce7";

function getWeekBounds(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function toLocalDateTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getWeekOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const { monday, sunday } = getWeekBounds(d);
    const label = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    options.push({
      label,
      start: toLocalDateTimeString(monday),
      end: toLocalDateTimeString(sunday),
    });
  }
  return options;
}

function formatXP(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return String(value);
}

export default function HomePage() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const mountedRef = useRef(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [welcomingPhrase] = useState(() => getWelcomingPhrase());

  const [weeklyBars, setWeeklyBars] = useState<WeeklyBar[]>([]);
  const [recentExercises, setRecentExercises] = useState<RecentExercise[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [weekOptions] = useState(getWeekOptions);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [dayDetails, setDayDetails] = useState<DayDetailItem[]>([]);
  const [loadingDayDetails, setLoadingDayDetails] = useState(false);
  const RECENT_PAGE_SIZE = 5;
  const [recentPage, setRecentPage] = useState(1);
  const [recentTotalCount, setRecentTotalCount] = useState(0);
  const [loadingRecentPage, setLoadingRecentPage] = useState(false);

  const handleExit = () => {
    if (mountedRef.current) {
      setShowExitDialog(false);
      if (Platform.OS === "android") {
        BackHandler.exitApp();
      } else {
        router.back();
      }
    }
  };

  const handleCancel = () => {
    if (mountedRef.current) {
      setShowExitDialog(false);
    }
  };

  const handleBackPress = () => {
    if (mountedRef.current) {
      setShowExitDialog(true);
    }
    return true;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [seen, imported] = await Promise.all([
          hasSeenTutorial(),
          isDataImported(),
        ]);
        if (!cancelled && !seen) {
          setShowTutorial(true);
          await markTutorialSeen();
        }
      } catch (error) {
        console.error("Failed to check tutorial state", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress,
      );
      return () => subscription.remove();
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const db = await getDatabase();
        const profile = await getUserProfile(db);
        if (profile && mountedRef.current) {
          setUserId(profile.user_id);
        }
      } catch (error) {
        console.error("Failed to load user", error);
      }
    }
    const timer = setTimeout(() => {
      loadUser();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function loadTotalXP() {
      try {
        const db = await getDatabase();
        const total = await getTotalEarnedXP(db, userId);
        if (mountedRef.current) {
          setTotalXP(total);
        }
      } catch (error) {
        console.error("Failed to load total XP", error);
      }
    }

    loadTotalXP();

    async function loadWeeklyData() {
      if (!mountedRef.current) return;
      setLoading(true);
      try {
        const db = await getDatabase();
        const week = weekOptions[selectedWeekIndex];
        const rows = await getWeeklyProgress(db, userId, week.start, week.end);

        const dayMap: Record<number, { completed_count: number; total_xp: number }> = {};
        for (let i = 0; i < 7; i++) {
          dayMap[i] = { completed_count: 0, total_xp: 0 };
        }

        let maxXp = 1;
        rows.forEach((row: any) => {
          const dayNum = parseInt(row.day_of_week, 10);
          dayMap[dayNum] = {
            completed_count: row.completed_count ?? 0,
            total_xp: row.total_xp ?? 0,
          };
          if ((row.total_xp ?? 0) > maxXp) maxXp = row.total_xp ?? 1;
        });

        const bars: WeeklyBar[] = DAY_LABELS.map((day, idx) => {
          const xp = dayMap[idx]?.total_xp ?? 0;
          const height = Math.max(4, Math.round((xp / maxXp) * 92));
          return { day, height, dayIndex: idx };
        });

        if (mountedRef.current) {
          setWeeklyBars(bars);
        }
      } catch (error) {
        console.error("Failed to load weekly progress", error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    loadWeeklyData();
  }, [userId, selectedWeekIndex, weekOptions]);

  const handleDayPress = async (dayIndex: number) => {
    if (!userId) return;
    setSelectedDayIndex(dayIndex);
    setLoadingDayDetails(true);
    setShowDayDetail(true);
    try {
      const db = await getDatabase();
      const week = weekOptions[selectedWeekIndex];
      const rows = await getWeeklyProgressDetails(db, userId, week.start, week.end, dayIndex);
      setDayDetails(rows);
    } catch (error) {
      console.error("Failed to load day details", error);
      setDayDetails([]);
    } finally {
      setLoadingDayDetails(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const typeIcons: Record<string, { icon: any; bg: string; color: string }> = {
      sentence_builder: {
        icon: { ios: "puzzlepiece.fill", android: "construction", web: "construction" },
        bg: Colors.light.tertiaryContainer,
        color: Colors.light.onTertiary,
      },
      spelling: {
        icon: { ios: "textformat", android: "text_fields", web: "text_fields" },
        bg: Colors.light.primaryContainer,
        color: Colors.light.onPrimaryContainer,
      },
      fill_blank_spelling: {
        icon: { ios: "textbox", android: "edit", web: "edit" },
        bg: Colors.light.surfaceContainer,
        color: Colors.light.onSurfaceVariant,
      },
    };

    const mapRows = (rows: any[]): RecentExercise[] =>
      rows.map((row: any) => {
        const meta = typeIcons[row.type] ?? typeIcons.fill_blank_spelling;
        return {
          id: String(row.id),
          type: row.type,
          typeIcon: meta.icon,
          typeIconBg: meta.bg,
          typeIconColor: meta.color,
          title: row.title,
          status: "Completed" as const,
          statusIcon: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
            statusColor: Colors.light.primary,
            xp: `+${row.xp ?? 5} XP`,
            xpColor: XP_COLOR,
          };
        });

    async function loadRecentPage(page: number) {
      if (!mountedRef.current) return;
      setLoadingRecentPage(true);
      try {
        const db = await getDatabase();
        const [rows, total] = await Promise.all([
          getRecentCompletedExercises(db, userId!, RECENT_PAGE_SIZE, (page - 1) * RECENT_PAGE_SIZE),
          getRecentCompletedExercisesCount(db, userId!),
        ]);
        if (mountedRef.current) {
          setRecentExercises(mapRows(rows));
          setRecentTotalCount(total);
          setRecentPage(page);
        }
      } catch (error) {
        console.error("Failed to load recent exercises", error);
      } finally {
        if (mountedRef.current) setLoadingRecentPage(false);
      }
    }

    loadRecentPage(1);
  }, [userId]);

  const handlePageChange = (newPage: number) => {
    if (loadingRecentPage) return;
    const totalPages = Math.max(1, Math.ceil(recentTotalCount / RECENT_PAGE_SIZE));
    if (newPage < 1 || newPage > totalPages) return;
    if (!userId) return;
    setLoadingRecentPage(true);
    (async () => {
      try {
        const db = await getDatabase();
        const rows = await getRecentCompletedExercises(
          db,
          userId,
          RECENT_PAGE_SIZE,
          (newPage - 1) * RECENT_PAGE_SIZE,
        );
        if (mountedRef.current) {
          setRecentExercises(
            rows.map((row: any) => {
              const meta = (
                {
                  sentence_builder: {
                    icon: { ios: "puzzlepiece.fill", android: "construction", web: "construction" },
                    bg: Colors.light.tertiaryContainer,
                    color: Colors.light.onTertiary,
                  },
                  spelling: {
                    icon: { ios: "textformat", android: "text_fields", web: "text_fields" },
                    bg: Colors.light.primaryContainer,
                    color: Colors.light.onPrimaryContainer,
                  },
                  fill_blank_spelling: {
                    icon: { ios: "textbox", android: "edit", web: "edit" },
                    bg: Colors.light.surfaceContainer,
                    color: Colors.light.onSurfaceVariant,
                  },
                } as Record<string, { icon: any; bg: string; color: string }>
              )[row.type] ?? {
                icon: { ios: "textbox", android: "edit", web: "edit" },
                bg: Colors.light.surfaceContainer,
                color: Colors.light.onSurfaceVariant,
              };
              return {
                id: String(row.id),
                type: row.type,
                typeIcon: meta.icon,
                typeIconBg: meta.bg,
                typeIconColor: meta.color,
                title: row.title,
                status: "Completed" as const,
                statusIcon: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
                statusColor: Colors.light.primary,
                xp: `+${row.xp ?? 5} XP`,
                xpColor: XP_COLOR,
              };
            }),
          );
          setRecentPage(newPage);
        }
      } catch (error) {
        console.error("Failed to change recent exercises page", error);
      } finally {
        if (mountedRef.current) setLoadingRecentPage(false);
      }
    })();
  };

  const renderStatCard = (card: StatCard) => {
    const displayValue = card.id === "3" ? formatXP(totalXP) : card.value;
    return (
      <View
        key={card.id}
        style={[
          styles.statCard,
          { backgroundColor: card.iconBg },
        ]}>
        <View style={styles.statCardInner}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: "#ffffff30" },
            ]}>
            <SymbolView
              name={card.icon}
              size={28}
              tintColor={card.iconColor}
            />
          </View>
          <ThemedText style={styles.statValue}>{displayValue}</ThemedText>
          <ThemedText style={styles.statLabel}>{card.label}</ThemedText>
        </View>
        <View
          style={[
            styles.statHoverOverlay,
            { backgroundColor: "#ffffff20" },
          ]}
        />
      </View>
    );
  };

  const renderWeeklyBar = (item: WeeklyBar, index: number) => (
    <Pressable
      key={item.day}
      style={styles.weekBarContainer}
      onPress={() => handleDayPress(item.dayIndex)}>
      <View style={styles.weekBarTrack}>
        <View
          style={[
            styles.weekBarFill,
            {
              height: Math.max(item.height, 4),
              backgroundColor:
                index === new Date().getDay()
                  ? "#15803d"
                  : "#86efac",
            },
          ]}
        />
      </View>
      <ThemedText
        style={[
          styles.weekBarLabel,
          index === new Date().getDay() && styles.weekBarLabelActive,
        ]}>
        {item.day}
      </ThemedText>
    </Pressable>
  );

  const renderRecentExercise = (item: RecentExercise) => (
    <View key={item.id} style={styles.exerciseItem}>
      <View style={styles.exerciseItemLeft}>
        <View
          style={[
            styles.exerciseIconContainer,
            {
              backgroundColor: `${item.typeIconBg}20`,
            },
          ]}>
          <SymbolView
            name={item.typeIcon}
            size={20}
            tintColor={item.typeIconColor}
          />
        </View>
        <View style={styles.exerciseItemInfo}>
          <ThemedText style={styles.exerciseTitle}>{item.title}</ThemedText>
          <View style={styles.exerciseStatusRow}>
            <SymbolView
              name={item.statusIcon}
              size={14}
              tintColor={item.statusColor}
            />
            <ThemedText
              style={[
                styles.exerciseStatusText,
                { color: item.statusColor },
              ]}>
              {item.status}
            </ThemedText>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.exerciseXpChip,
          {
            backgroundColor:
              item.xpColor === XP_COLOR
                ? XP_CHIP_BG
                : Colors.light.surfaceContainer,
          },
        ]}>
        <ThemedText
          style={[
            styles.exerciseXpText,
            { color: item.xpColor },
          ]}>
          {item.xp}
        </ThemedText>
      </View>
    </View>
  );

  const selectedWeek = weekOptions[selectedWeekIndex];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <AppHeader />
        <Pressable
          style={styles.helpButton}
          onPress={() => setShowTutorial(true)}
          hitSlop={8}>
          <SymbolView
            name={{ ios: "questionmark.circle", android: "help", web: "help" } as any}
            size={24}
            tintColor="#15803d"
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Your Stats</ThemedText>
          <View style={styles.statGrid}>
            <View style={styles.statGridRow}>
              {STAT_CARDS.slice(0, 2).map(renderStatCard)}
            </View>
            <View style={styles.statGridRow}>
              {renderStatCard(STAT_CARDS[2])}
            </View>
          </View>
        </View>

        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <View>
              <ThemedText style={styles.sectionTitle}>Weekly Progress</ThemedText>
              <Pressable onPress={() => setShowWeekPicker(true)}>
                <ThemedText style={styles.weekLabel}>
                  {selectedWeek?.label ?? "Select Week"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
          {loading ? (
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          ) : (
            <View style={styles.weeklyChart}>
              <View style={styles.weeklyChartInner}>
                {weeklyBars.map(renderWeeklyBar)}
              </View>
            </View>
          )}
        </View>

        <View style={styles.recentSection}>
          <ThemedText style={styles.sectionTitle}>Recent Exercises</ThemedText>
          <View style={styles.recentList}>
            {loadingRecentPage && recentExercises.length === 0 ? (
              <ThemedText style={styles.emptyText}>Loading...</ThemedText>
            ) : recentExercises.length > 0 ? (
              recentExercises.map(renderRecentExercise)
            ) : (
              <ThemedText style={styles.emptyText}>No recent exercises yet.</ThemedText>
            )}
          </View>
          {recentTotalCount > RECENT_PAGE_SIZE && (
            <View style={styles.paginationRow}>
              <Pressable
                style={[
                  styles.paginationButton,
                  (recentPage === 1 || loadingRecentPage) && styles.paginationButtonDisabled,
                ]}
                onPress={() => handlePageChange(recentPage - 1)}
                disabled={recentPage === 1 || loadingRecentPage}>
                <ThemedText
                  style={[
                    styles.paginationButtonText,
                    (recentPage === 1 || loadingRecentPage) && styles.paginationButtonTextDisabled,
                  ]}>
                  Prev
                </ThemedText>
              </Pressable>
              <ThemedText style={styles.paginationInfo}>
                Page {recentPage} of {Math.ceil(recentTotalCount / RECENT_PAGE_SIZE)}
              </ThemedText>
              <Pressable
                style={[
                  styles.paginationButton,
                  (recentPage >= Math.ceil(recentTotalCount / RECENT_PAGE_SIZE) || loadingRecentPage) &&
                    styles.paginationButtonDisabled,
                ]}
                onPress={() => handlePageChange(recentPage + 1)}
                disabled={
                  recentPage >= Math.ceil(recentTotalCount / RECENT_PAGE_SIZE) || loadingRecentPage
                }>
                <ThemedText
                  style={[
                    styles.paginationButtonText,
                    (recentPage >= Math.ceil(recentTotalCount / RECENT_PAGE_SIZE) || loadingRecentPage) &&
                      styles.paginationButtonTextDisabled,
                  ]}>
                  Next
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {showWeekPicker && (
        <View style={styles.weekPickerOverlay}>
          <View style={styles.weekPickerCard}>
            <View style={styles.weekPickerHeader}>
              <ThemedText style={styles.weekPickerTitle}>Select Week</ThemedText>
              <Pressable onPress={() => setShowWeekPicker(false)}>
                <ThemedText style={styles.weekPickerDone}>Done</ThemedText>
              </Pressable>
            </View>
            <ScrollView style={styles.weekPickerList}>
              {weekOptions.map((week, idx) => (
                <Pressable
                  key={week.label}
                  style={[
                    styles.weekPickerItem,
                    selectedWeekIndex === idx && styles.weekPickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedWeekIndex(idx);
                    setShowWeekPicker(false);
                  }}>
                  <ThemedText
                    style={[
                      styles.weekPickerItemText,
                      selectedWeekIndex === idx && styles.weekPickerItemTextActive,
                    ]}>
                    {week.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {showDayDetail && (
        <Modal
          visible={showDayDetail}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDayDetail(false)}>
          <View style={styles.dayDetailOverlay}>
            <View style={styles.dayDetailCard}>
              <View style={styles.dayDetailHeader}>
                <ThemedText style={styles.dayDetailTitle}>
                  {selectedDayIndex !== null ? DAY_LABELS[selectedDayIndex] : ""} Progress
                </ThemedText>
                <Pressable onPress={() => setShowDayDetail(false)}>
                  <ThemedText style={styles.dayDetailClose}>Close</ThemedText>
                </Pressable>
              </View>
              {loadingDayDetails ? (
                <ThemedText style={styles.dayDetailLoading}>Loading...</ThemedText>
              ) : dayDetails.length === 0 ? (
                <ThemedText style={styles.dayDetailEmpty}>No exercises completed on this day.</ThemedText>
              ) : (
                <ScrollView style={styles.dayDetailList}>
                  {dayDetails.map((item) => (
                    <View key={item.id} style={styles.dayDetailItem}>
                      <View style={styles.dayDetailItemHeader}>
                        <ThemedText style={styles.dayDetailTopic}>{item.topic_title}</ThemedText>
                        <View style={styles.dayDetailBadges}>
                          <View style={styles.dayDetailBadge}>
                            <ThemedText style={styles.dayDetailBadgeText}>{item.level}</ThemedText>
                          </View>
                          <View style={[styles.dayDetailBadge, styles.dayDetailBadgeXP]}>
                            <ThemedText style={[styles.dayDetailBadgeText, styles.dayDetailBadgeTextXP]}>+{item.xp ?? 5} XP</ThemedText>
                          </View>
                        </View>
                      </View>
                      <ThemedText style={styles.dayDetailPrompt}>{item.title}</ThemedText>
                      <ThemedText style={styles.dayDetailGrammar}>{item.grammar_focus}</ThemedText>
                      <ThemedText style={styles.dayDetailTime}>
                        {new Date(item.recorded_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </ThemedText>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}

      <NavBar />

      <AlertDialog
        visible={showExitDialog}
        type="warning"
        title="Exit App"
        message="Are you sure you want to exit? Your progress will be saved."
        confirmText="Exit"
        cancelText="Cancel"
        onConfirm={handleExit}
        onCancel={handleCancel}
      />

      <TutorialModal
        visible={showTutorial}
        welcomingPhrase={welcomingPhrase}
        onClose={() => setShowTutorial(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 32,
  },
  sectionTitle: {
    color: Colors.light.onSurface,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  statsSection: {
    gap: 12,
  },
  statGrid: {
    gap: 12,
  },
  statGridRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
    flex: 1,
  },
  statCardInner: {
    alignItems: "center",
    gap: 4,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: Colors.light.onSurface,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  statLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  statHoverOverlay: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    borderRadius: 16,
  },
  weeklySection: {
    gap: 12,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weeklySeeAll: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  weeklyChart: {
    padding: 24,
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  weeklyChartInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    height: 128,
  },
  weekBarContainer: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  weekBarTrack: {
    width: "100%",
    height: 96,
    borderRadius: 9999,
    backgroundColor: Colors.light.surfaceContainerHigh,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  weekBarFill: {
    width: "100%",
    minHeight: 4,
    borderRadius: 9999,
  },
  weekBarLabel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  weekBarLabelActive: {
    color: "#15803d",
    fontWeight: "700",
  },
  recentSection: {
    gap: 12,
  },
  recentList: {
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  exerciseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseTitle: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  exerciseStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  exerciseStatusText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  exerciseXpChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  exerciseXpText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  loadingText: {
    textAlign: "center",
    paddingVertical: 24,
    color: Colors.light.onSurfaceVariant,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 16,
    color: Colors.light.onSurfaceVariant,
  },
  weekLabel: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 4,
  },
  weekPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  weekPickerCard: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  weekPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  weekPickerTitle: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
  weekPickerDone: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  weekPickerList: {
    maxHeight: 300,
  },
  weekPickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  weekPickerItemActive: {
    backgroundColor: Colors.light.primaryContainer,
  },
  weekPickerItemText: {
    color: Colors.light.onSurface,
    fontSize: 14,
    fontWeight: "500",
  },
  weekPickerItemTextActive: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  dayDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  dayDetailCard: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  dayDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  dayDetailTitle: {
    color: Colors.light.onSurface,
    fontSize: 18,
    fontWeight: "700",
  },
  dayDetailClose: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  dayDetailLoading: {
    textAlign: "center",
    paddingVertical: 24,
    color: Colors.light.onSurfaceVariant,
  },
  dayDetailEmpty: {
    textAlign: "center",
    paddingVertical: 24,
    color: Colors.light.onSurfaceVariant,
  },
  dayDetailList: {
    padding: 16,
    maxHeight: 400,
  },
  dayDetailItem: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    gap: 8,
  },
  dayDetailItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayDetailTopic: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  dayDetailBadges: {
    flexDirection: "row",
    gap: 8,
  },
  dayDetailBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  dayDetailBadgeXP: {
    backgroundColor: "#dcfce7",
  },
  dayDetailBadgeText: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  dayDetailBadgeTextXP: {
    color: "#15803d",
  },
  dayDetailPrompt: {
    color: Colors.light.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  dayDetailGrammar: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "500",
  },
  dayDetailTime: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  loadMoreButton: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: Colors.light.primaryContainer,
    marginTop: 4,
  },
  loadMoreText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: Colors.light.primaryContainer,
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.light.surfaceContainer,
  },
  paginationButtonText: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  paginationButtonTextDisabled: {
    color: Colors.light.onSurfaceVariant,
  },
  paginationInfo: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
    marginTop: 8,
  },
});
