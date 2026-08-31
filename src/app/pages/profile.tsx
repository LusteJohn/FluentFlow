import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from "@/backend/UserProfile";
import { getDatabase } from "@/database/database";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

interface UserProfile {
  user_id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  name_ext: string | null;
  birthdate: string | null;
  gender: string | null;
  address: string | null;
}

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
          const existing = await getUserProfile(db);
          if (isActive) {
            setProfile(existing);
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
        onPress={() => handleConfirmDate(d)}>
        <ThemedText
          style={[
            styles.dayText,
            birthdate ===
              `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` &&
              styles.dayTextActive,
          ]}>
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
      Alert.alert("Error", error?.message ?? "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fullName = [
    firstname,
    middlename,
    lastname,
    nameExt,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <AppHeader />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AppHeader />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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
                tintColor={Colors.light.onPrimaryContainer}
              />
            </View>
          </View>
          <ThemedText type="headlineMd" style={styles.profileName}>
            {fullName || "Your Profile"}
          </ThemedText>
          {profile && (
            <ThemedText style={styles.profileSubtitle}>
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </ThemedText>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="headlineMd" style={styles.sectionTitle}>
              Personal Information
            </ThemedText>
            {!isEditing && (
              <Pressable onPress={() => setIsEditing(true)}>
                <SymbolView
                  name={{
                    ios: "edit",
                    android: "edit",
                    web: "edit",
                  }}
                  size={20}
                  tintColor={Colors.light.primary}
                />
              </Pressable>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <ThemedText style={styles.label}>First Name *</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={firstname}
                  onChangeText={setFirstname}
                  placeholder="Enter first name"
                  placeholderTextColor={Colors.light.onSurfaceVariant}
                  editable={isEditing}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.label}>Middle Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={middlename}
                  onChangeText={setMiddlename}
                  placeholder="Enter middle name"
                  placeholderTextColor={Colors.light.onSurfaceVariant}
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <ThemedText style={styles.label}>Last Name *</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder="Enter last name"
                  placeholderTextColor={Colors.light.onSurfaceVariant}
                  editable={isEditing}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.label}>Name Extension</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={nameExt}
                  onChangeText={setNameExt}
                  placeholder="e.g. Jr., Sr., III"
                  placeholderTextColor={Colors.light.onSurfaceVariant}
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
                ]}>
                <ThemedText
                  style={[
                    styles.dateText,
                    !birthdate && styles.datePlaceholder,
                  ]}>
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
                    tintColor={Colors.light.primary}
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
                        onPress={() => setGender(option)}>
                        <ThemedText
                          style={[
                            styles.genderOptionText,
                            gender === option && styles.genderOptionTextSelected,
                          ]}>
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
                    placeholderTextColor={Colors.light.onSurfaceVariant}
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
                placeholderTextColor={Colors.light.onSurfaceVariant}
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
              }}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              <ThemedText style={styles.saveButtonText}>
                {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
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
                <ThemedText style={styles.datePickerCancel}>Cancel</ThemedText>
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
                contentContainerStyle={styles.monthScroll}>
                {MONTHS.map((name, idx) => (
                  <Pressable
                    key={name}
                    style={[
                      styles.monthChip,
                      pickerMonth === idx && styles.monthChipActive,
                    ]}
                    onPress={() => setPickerMonth(idx)}>
                    <ThemedText
                      style={[
                        styles.monthChipText,
                        pickerMonth === idx && styles.monthChipTextActive,
                      ]}>
                      {name.slice(0, 3)}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                style={styles.yearScroll}
                showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <Pressable
                    key={y}
                    style={[
                      styles.yearItem,
                      pickerYear === y && styles.yearItemActive,
                    ]}
                    onPress={() => setPickerYear(y)}>
                    <ThemedText
                      style={[
                        styles.yearText,
                        pickerYear === y && styles.yearTextActive,
                      ]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
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
    color: Colors.light.onSurfaceVariant,
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
    backgroundColor: Colors.light.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.light.primaryFixed,
  },
  profileName: {
    color: Colors.light.onSurface,
    textAlign: "center",
  },
  profileSubtitle: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    backgroundColor: Colors.light.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: Colors.light.onSurface,
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
    color: Colors.light.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.onSurface,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  inputDisabled: {
    backgroundColor: Colors.light.surfaceContainer,
    color: Colors.light.onSurface,
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
    color: Colors.light.onSurface,
    fontSize: 16,
  },
  datePlaceholder: {
    color: Colors.light.onSurfaceVariant,
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  genderOptionSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  genderOptionText: {
    color: Colors.light.onSurface,
    fontSize: 12,
    fontWeight: "600",
  },
  genderOptionTextSelected: {
    color: Colors.light.onPrimary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  datePickerCard: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  datePickerCancel: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "600",
  },
  datePickerTitle: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
  datePickerDone: {
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  monthChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  monthChipText: {
    color: Colors.light.onSurface,
    fontSize: 12,
    fontWeight: "600",
  },
  monthChipTextActive: {
    color: Colors.light.onPrimary,
  },
  yearScroll: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: 12,
  },
  yearItem: {
    paddingVertical: 10,
    alignItems: "center",
  },
  yearItemActive: {
    backgroundColor: Colors.light.primaryContainer,
  },
  yearText: {
    color: Colors.light.onSurface,
    fontSize: 16,
    fontWeight: "500",
  },
  yearTextActive: {
    color: Colors.light.primary,
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
    color: Colors.light.onSurfaceVariant,
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
    color: Colors.light.onSurface,
    fontSize: 14,
    fontWeight: "500",
  },
  dayTextActive: {
    color: Colors.light.onPrimary,
    fontWeight: "700",
  },
});
