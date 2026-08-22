import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { importJourneyData, importTopicData, importTopicIntroData } from "@/database/database";
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

  const closeDialog = () => setDialog(null);

  const handleImportData = async () => {
    try {
      await importJourneyData();
      await importTopicData();
      await importTopicIntroData();
      setDialog({
        type: "success",
        title: "Import Succeeded",
        message:
          "Journey, topic, and topic intro data imported successfully!",
      });
    } catch (error: any) {
      setDialog({
        type: "error",
        title: "Import Failed",
        message:
          error?.message ?? "Failed to import data. Please try again.",
      });
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
              Import All Data
            </ThemedText>
          </Pressable>
          <ThemedText type="small" style={styles.hint}>
            This will insert default journey, topic, and topic intro records if none exist.
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
