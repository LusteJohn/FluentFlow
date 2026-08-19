import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { createUser, getDatabase } from "@/database/database";

export default function RegisterStudent() {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name.");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      Alert.alert("Validation Error", "Please enter a valid age.");
      return;
    }

    setLoading(true);
    try {
      const db = await getDatabase();
      await createUser(db, fullName.trim(), parsedAge);
      Alert.alert("Success", "Student registered successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to register student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          Register Student
        </ThemedText>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Full Name
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor={Colors.light.onSurfaceVariant}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Age
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              placeholderTextColor={Colors.light.onSurfaceVariant}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Registering..." : "Register"}</Text>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
    color: Colors.light.primary,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: Colors.light.onSurface,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.onSurface,
    backgroundColor: Colors.light.surface,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
    marginTop: 12,
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
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
  },
});
