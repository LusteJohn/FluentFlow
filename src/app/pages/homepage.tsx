import { BackHandler, Platform, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import AlertDialog from "@/components/alert-dialog";
import NavBar from "../(tabs)/navBar";
import AppHeader from "../(tabs)/header";

export default function HomePage() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExit = () => {
    setShowExitDialog(false);
    if (Platform.OS === "android") {
      BackHandler.exitApp();
    } else {
      router.back();
    }
  };

  const handleCancel = () => {
    setShowExitDialog(false);
  };

  const handleBackPress = () => {
    setShowExitDialog(true);
    return true;
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress,
      );
      return () => subscription.remove();
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome Home
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          You are already registered.
        </ThemedText>
        <Pressable
          style={styles.button}
          onPress={() => setShowExitDialog(true)}>
          <ThemedText type="default" style={styles.buttonText}>
            Go Back
          </ThemedText>
        </Pressable>
      </View>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: Colors.light.primary,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.light.onSurfaceVariant,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
  },
  buttonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
