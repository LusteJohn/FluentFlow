import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import Animated, {
  Easing,
  FadeIn as AnimatedFadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { getAllJourneyProgressForUser } from "@/backend/Journey";
import { getAllTopics } from "@/backend/Topic";
import {
  getRecentCompletedExercisesCount,
  getTotalEarnedXP,
} from "@/backend/UserExerciseProgress";
import { getAllLevelProgressForTopic } from "@/backend/UserLevelProgress";
import { getStreakByUserId } from "@/backend/UserStreak";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from "@/backend/UserProfile";
import { ScreenMotion } from "@/components/screen-motion";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/contexts/theme-context";
import { getDatabase } from "@/database/database";
import AppHeader from "../(tabs)/header";
import NavBar from "../(tabs)/navBar";

interface UserProfile {
  user_id: number;
  created_at?: string;
  firstname: string;
  middlename: string | null;
  lastname: string;
  name_ext: string | null;
  birthdate: string | null;
  gender: string | null;
  address: string | null;
}

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const STAT_ANIMATION_DURATION = 650;

interface ProfileStats {
  completedLessons: number;
  badges: number;
  learningProgress: number;
  streak: number;
  totalXP: number;
}

interface AnimatedStatValueProps {
  value: number;
  suffix?: string;
  delay: number;
  styles: ReturnType<typeof createStyles>;
}

interface AnimatedProgressBarProps {
  value: number;
  delay: number;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}

function AnimatedStatValue({
  value,
  suffix = "",
  delay,
  styles,
}: AnimatedStatValueProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: STAT_ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedValue, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    minWidth: 52,
  }));

  const valueStyle = useAnimatedStyle(() => {
    const valueWidth = String(Math.round(animatedValue.value)).length + suffix.length;
    return { width: Math.max(2, valueWidth) * 12 };
  });

  return (
    <Animated.View style={[styles.statValueContainer, animatedStyle]}>
      <Animated.Text
        style={[styles.statValue, valueStyle]}
        entering={AnimatedFadeIn.delay(delay).duration(240)}
      >
        {Math.round(animatedValue.value)}
        {suffix}
      </Animated.Text>
    </Animated.View>
  );
}

function AnimatedProgressBar({
  value,
  delay,
  theme,
  styles,
}: AnimatedProgressBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value / 100, {
      duration: STAT_ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[styles.progressFill, { backgroundColor: theme.primary }, progressStyle]}
        entering={AnimatedFadeIn.delay(delay).duration(240)}
      />
    </View>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [nameExt, setNameExt] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProfile() {
        try {
          const db = await getDatabase();
          const [existing, topics] = await Promise.all([
            getUserProfile(db),
            getAllTopics(db),
          ]);

          let stats: ProfileStats | null = null;
          if (existing) {
            const [
              completedLessons,
              totalXP,
              journeyProgress,
              streakData,
            ] = await Promise.all([
              getRecentCompletedExercisesCount(db, existing.user_id),
              getTotalEarnedXP(db, existing.user_id),
              getAllJourneyProgressForUser(db, existing.user_id),
              getStreakByUserId(db, existing.user_id),
            ]);
            let completedLevels = 0;
            let totalLevels = 0;

            for (const topic of topics ?? []) {
              const progress = await getAllLevelProgressForTopic(
                db,
                existing.user_id,
                topic.topic_id,
              );
              for (const level of LEVELS) {
                totalLevels += 1;
                if (progress[level]?.status === "completed") {
                  completedLevels += 1;
                }
              }
            }

            const totalJourneyExercises = Object.values(
              journeyProgress ?? {},
            ).reduce(
              (sum, progress) => sum + (progress?.totalExercises ?? 0),
              0,
            );
            const completedJourneyExercises = Object.values(
              journeyProgress ?? {},
            ).reduce(
              (sum, progress) => sum + (progress?.completedExercises ?? 0),
              0,
            );
            const learningProgress = totalJourneyExercises > 0
              ? Math.round(
                  (completedJourneyExercises / totalJourneyExercises) * 100,
                )
              : totalLevels > 0
                ? Math.round((completedLevels / totalLevels) * 100)
                : 0;

            stats = {
              completedLessons,
              badges: completedLevels,
              learningProgress,
              streak: streakData?.current_streak ?? 0,
              totalXP,
            };
          }

          if (isActive) {
            setProfile(existing);
            setProfileStats(stats);
            if (existing) {
              setFirstname(existing.firstname ?? "");
              setMiddlename(existing.middlename ?? "");
              setLastname(existing.lastname ?? "");
              setNameExt(existing.name_ext ?? "");
              setBirthdate(existing.birthdate ?? "");
              setGender(existing.gender ?? "");
              setAddress(existing.address ?? "");
            }
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          if (isActive) setLoading(false);
        }
      }

      loadProfile();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleBirthdatePress = () => {
    if (!isEditing) return;
    if (birthdate) {
      const parts = birthdate.split("-");
      setPickerYear(parseInt(parts[0], 10));
      setPickerMonth(parseInt(parts[1], 10) - 1);
    } else {
      const today = new Date();
      setPickerYear(today.getFullYear());
      setPickerMonth(today.getMonth());
    }
    setShowDatePicker(true);
  };

  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number) =>
    new Date(year, month, 1).getDay();

  const handleConfirmDate = (day: number) => {
    const month = String(pickerMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    setBirthdate(`${pickerYear}-${month}-${dayStr}`);
    setShowDatePicker(false);
  };

  const daysInMonth = getDaysInMonth(pickerMonth, pickerYear);
  const firstDay = getFirstDayOfMonth(pickerMonth, pickerYear);
  const today = new Date();
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const dayCells = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells.push(
      <Pressable
        key={d}
        style={styles.dayCell}
        onPress={() => handleConfirmDate(d)}
      >
        <ThemedText
          style={[
            styles.dayText,
            birthdate ===
              `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` &&
              styles.dayTextActive,
          ]}
        >
          {d}
        </ThemedText>
      </Pressable>,
    );
  }

  const handleSave = async () => {
    if (!firstname.trim() || !lastname.trim()) {
      Alert.alert("Validation Error", "First name and last name are required.");
      return;
    }

    setSaving(true);
    try {
      const db = await getDatabase();
      if (profile) {
        const updated = await updateUserProfile(db, profile.user_id, {
          firstname: firstname.trim(),
          middlename: middlename.trim() || null,
          lastname: lastname.trim(),
          name_ext: nameExt.trim() || null,
          birthdate: birthdate.trim() || null,
          gender: gender.trim() || null,
          address: address.trim() || null,
        });
        setProfile(updated);
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        const created = await createUserProfile(db, {
          firstname: firstname.trim(),
          middlename: middlename.trim() || null,
          lastname: lastname.trim(),
          name_ext: nameExt.trim() || null,
          birthdate: birthdate.trim() || null,
          gender: gender.trim() || null,
          address: address.trim() || null,
        });
        setProfile(created);
        setIsEditing(false);
        Alert.alert("Success", "Profile created successfully!");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message ?? "Failed to save profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fullName = [firstname, middlename, lastname, nameExt]
    .filter(Boolean)
    .join(" ");
  const stats = profileStats ?? {
    completedLessons: 0,
    badges: 0,
    learningProgress: 0,
    streak: 0,
    totalXP: 0,
  };

  if (loading) {
    return (
      <ScreenMotion>
        <ThemedView style={styles.container}>
          <AppHeader />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </ThemedView>
      </ScreenMotion>
    );
  }

  return (
    <ScreenMotion>
      <ThemedView style={styles.container}>
        <AppHeader />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <SymbolView
                    name={{
                      ios: "person.fill",
                      android: "person",
                      web: "person",
                    }}
                    size={48}
                    tintColor={theme.onPrimaryContainer}
                  />
                </View>
              </View>
              <ThemedText type="title" style={styles.profileName}>
                {fullName || "Your Profile"}
              </ThemedText>
              {profile && (
                <ThemedText style={styles.profileSubtitle}>
                  Member since{" "}
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "-"}
                </ThemedText>
              )}
            </View>

            {profileStats && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText
                    type="title"
                    style={styles.sectionTitle}
                  >
                    Learning Summary
                  </ThemedText>
                </View>

                <View style={styles.statGrid}>
                  <AnimatedStatValue
                    value={stats.completedLessons}
                    delay={80}
                    styles={styles}
                  />
                  <AnimatedStatValue
                    value={stats.totalXP}
                    suffix=" XP"
                    delay={160}
                    styles={styles}
                  />
                  <AnimatedStatValue
                    value={stats.badges}
                    delay={240}
                    styles={styles}
                  />
                  <AnimatedStatValue
                    value={stats.streak}
                    suffix=" day"
                    delay={320}
                    styles={styles}
                  />
                </View>

                <View style={styles.statLabels}>
                  <ThemedText style={styles.statLabel}>Completed lessons</ThemedText>
                  <ThemedText style={styles.statLabel}>Total XP</ThemedText>
                  <ThemedText style={styles.statLabel}>Badges</ThemedText>
                  <ThemedText style={styles.statLabel}>Day streak</ThemedText>
                </View>

                <View style={styles.progressHeader}>
                  <ThemedText style={styles.progressTitle}>Learning progress</ThemedText>
                  <ThemedText style={styles.progressValue}>
                    {stats.learningProgress}%
                  </ThemedText>
                </View>
                <AnimatedProgressBar
                  value={stats.learningProgress}
                  delay={400}
                  theme={theme}
                  styles={styles}
                />
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="title" style={styles.sectionTitle}>
                  Personal Information
                </ThemedText>
                {!isEditing && (
                  <Pressable onPress={() => setIsEditing(true)}>
                    <SymbolView
                      name={{
                        ios: "pencil",
                        android: "edit",
                        web: "edit",
                      }}
                      size={20}
                      tintColor={theme.primary}
                    />
                  </Pressable>
                )}
              </View>

              <View style={styles.form}>
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <ThemedText style={styles.label}>First Name *</ThemedText>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={firstname}
                      onChangeText={setFirstname}
                      placeholder="Enter first name"
                      placeholderTextColor={theme.onSurfaceVariant}
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.formField}>
                    <ThemedText style={styles.label}>Middle Name</ThemedText>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={middlename}
                      onChangeText={setMiddlename}
                      placeholder="Enter middle name"
                      placeholderTextColor={theme.onSurfaceVariant}
                      editable={isEditing}
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <ThemedText style={styles.label}>Last Name *</ThemedText>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={lastname}
                      onChangeText={setLastname}
                      placeholder="Enter last name"
                      placeholderTextColor={theme.onSurfaceVariant}
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.formField}>
                    <ThemedText style={styles.label}>Name Extension</ThemedText>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={nameExt}
                      onChangeText={setNameExt}
                      placeholder="e.g. Jr., Sr., III"
                      placeholderTextColor={theme.onSurfaceVariant}
                      editable={isEditing}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <ThemedText style={styles.label}>Birthdate</ThemedText>
                  <Pressable
                    onPress={handleBirthdatePress}
                    disabled={!isEditing}
                    style={[
                      styles.input,
                      styles.dateInput,
                      !isEditing && styles.inputDisabled,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dateText,
                        !birthdate && styles.datePlaceholder,
                      ]}
                    >
                      {birthdate || "YYYY-MM-DD"}
                    </ThemedText>
                    {isEditing && (
                      <SymbolView
                        name={{
                          ios: "calendar",
                          android: "calendar_today",
                          web: "calendar_today",
                        }}
                        size={20}
                        tintColor={theme.primary}
                      />
                    )}
                  </Pressable>
                </View>
                <View style={styles.formField}>
                  <ThemedText style={styles.label}>Gender</ThemedText>
                  {isEditing ? (
                    <View style={styles.genderContainer}>
                      {GENDER_OPTIONS.map((option) => (
                        <Pressable
                          key={option}
                          style={[
                            styles.genderOption,
                            gender === option && styles.genderOptionSelected,
                          ]}
                          onPress={() => setGender(option)}
                        >
                          <ThemedText
                            style={[
                              styles.genderOptionText,
                              gender === option &&
                                styles.genderOptionTextSelected,
                            ]}
                          >
                            {option}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value={gender}
                      placeholder="Select gender"
                      placeholderTextColor={theme.onSurfaceVariant}
                      editable={false}
                    />
                  )}
                </View>

                <View style={styles.formField}>
                  <ThemedText style={styles.label}>Address</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      !isEditing && styles.inputDisabled,
                    ]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your address"
                    placeholderTextColor={theme.onSurfaceVariant}
                    multiline
                    numberOfLines={3}
                    editable={isEditing}
                  />
                </View>
              </View>
            </View>

            {isEditing && (
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    if (profile) {
                      setFirstname(profile.firstname ?? "");
                      setMiddlename(profile.middlename ?? "");
                      setLastname(profile.lastname ?? "");
                      setNameExt(profile.name_ext ?? "");
                      setBirthdate(profile.birthdate ?? "");
                      setGender(profile.gender ?? "");
                      setAddress(profile.address ?? "");
                    }
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <ThemedText style={styles.saveButtonText}>
                    {saving
                      ? "Saving..."
                      : profile
                        ? "Update Profile"
                        : "Create Profile"}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerCard}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <ThemedText style={styles.datePickerCancel}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <ThemedText style={styles.datePickerTitle}>
                  {MONTHS[pickerMonth]} {pickerYear}
                </ThemedText>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <ThemedText style={styles.datePickerDone}>Done</ThemedText>
                </Pressable>
              </View>

              <View style={styles.datePickerBody}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthScroll}
                >
                  {MONTHS.map((name, idx) => (
                    <Pressable
                      key={name}
                      style={[
                        styles.monthChip,
                        pickerMonth === idx && styles.monthChipActive,
                      ]}
                      onPress={() => setPickerMonth(idx)}
                    >
                      <ThemedText
                        style={[
                          styles.monthChipText,
                          pickerMonth === idx && styles.monthChipTextActive,
                        ]}
                      >
                        {name.slice(0, 3)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>

                <ScrollView
                  style={styles.yearScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((y) => (
                    <Pressable
                      key={y}
                      style={[
                        styles.yearItem,
                        pickerYear === y && styles.yearItemActive,
                      ]}
                      onPress={() => setPickerYear(y)}
                    >
                      <ThemedText
                        style={[
                          styles.yearText,
                          pickerYear === y && styles.yearTextActive,
                        ]}
                      >
                        {y}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.dayGrid}>
                  {DAYS.map((d) => (
                    <ThemedText key={d} style={styles.dayHeader}>
                      {d}
                    </ThemedText>
                  ))}
                  {dayCells}
                </View>
              </View>
            </View>
          </View>
        )}

        <NavBar />
      </ThemedView>
    </ScreenMotion>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 24,
    },
    loadingText: {
      textAlign: "center",
      marginTop: 24,
      color: theme.onSurfaceVariant,
    },
    profileHeader: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 24,
    },
    avatarContainer: {
      marginBottom: 8,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: theme.primaryFixed,
    },
    profileName: {
      color: theme.onSurface,
      textAlign: "center",
    },
    profileSubtitle: {
      color: theme.onSurfaceVariant,
      fontSize: 14,
      textAlign: "center",
    },
    section: {
      backgroundColor: theme.surfaceContainerLowest,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      gap: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      color: theme.onSurface,
    },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    statValueContainer: {
      flexBasis: "45%",
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceContainerLow,
      borderRadius: 12,
    },
    statValue: {
      color: theme.onSurface,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
    },
    statLabels: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: -2,
    },
    statLabel: {
      width: "45%",
      color: theme.onSurfaceVariant,
      fontSize: 12,
      textAlign: "center",
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    progressTitle: {
      color: theme.onSurface,
      fontSize: 14,
      fontWeight: "600",
    },
    progressValue: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "700",
    },
    progressTrack: {
      height: 8,
      marginTop: 8,
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: theme.surfaceContainerHigh,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    form: {
      gap: 16,
    },
    formRow: {
      flexDirection: "row",
      gap: 12,
    },
    formField: {
      flex: 1,
      gap: 6,
    },
    label: {
      color: theme.onSurfaceVariant,
      fontSize: 14,
      fontWeight: "600",
    },
    input: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.onSurface,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    inputDisabled: {
      backgroundColor: theme.surfaceContainer,
      color: theme.onSurface,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateText: {
      color: theme.onSurface,
      fontSize: 16,
    },
    datePlaceholder: {
      color: theme.onSurfaceVariant,
    },
    genderContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9999,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    genderOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    genderOptionText: {
      color: theme.onSurface,
      fontSize: 12,
      fontWeight: "600",
    },
    genderOptionTextSelected: {
      color: theme.onPrimary,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: theme.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      color: theme.onSurface,
      fontSize: 16,
      fontWeight: "600",
    },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: theme.primary,
      borderBottomWidth: 3,
      borderBottomColor: theme.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: theme.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    datePickerOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    datePickerCard: {
      width: "90%",
      maxWidth: 360,
      backgroundColor: theme.surface,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    datePickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    datePickerCancel: {
      color: theme.onSurfaceVariant,
      fontSize: 14,
      fontWeight: "600",
    },
    datePickerTitle: {
      color: theme.onSurface,
      fontSize: 16,
      fontWeight: "700",
    },
    datePickerDone: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "700",
    },
    datePickerBody: {
      padding: 16,
      gap: 16,
    },
    monthScroll: {
      flexDirection: "row",
      gap: 8,
    },
    monthChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9999,
      backgroundColor: theme.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    monthChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    monthChipText: {
      color: theme.onSurface,
      fontSize: 12,
      fontWeight: "600",
    },
    monthChipTextActive: {
      color: theme.onPrimary,
    },
    yearScroll: {
      maxHeight: 120,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      borderRadius: 12,
    },
    yearItem: {
      paddingVertical: 10,
      alignItems: "center",
    },
    yearItemActive: {
      backgroundColor: theme.primaryContainer,
    },
    yearText: {
      color: theme.onSurface,
      fontSize: 16,
      fontWeight: "500",
    },
    yearTextActive: {
      color: theme.primary,
      fontWeight: "700",
    },
    dayGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "center",
    },
    dayHeader: {
      width: 36,
      textAlign: "center",
      color: theme.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "600",
      paddingVertical: 4,
    },
    dayCell: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
    },
    dayText: {
      color: theme.onSurface,
      fontSize: 14,
      fontWeight: "500",
    },
    dayTextActive: {
      color: theme.onPrimary,
      fontWeight: "700",
    },
  });
}
