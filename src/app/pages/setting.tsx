import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { importJourneyData } from "@/database/database";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

export default function SettingsPage() {
  const router = useRouter();

  const handleImportData = async () => {
    try {
      await importJourneyData();
      Alert.alert("Success", "Journey data imported successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to import data. Please try again.");
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
            ]}
            onPress={handleImportData}>
            <ThemedText type="default" style={styles.buttonText}>
              Import Journey Data
            </ThemedText>
          </Pressable>
          <ThemedText type="small" style={styles.hint}>
            This will insert default journey records if none exist.
          </ThemedText>
        </View>
      </View>
      <NavBar />
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
