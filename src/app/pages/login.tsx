import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";

export default function LoginPage() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <ThemedText type="displayMobile" style={styles.title}>
          A Situational English Learning App
        </ThemedText>
        <ThemedText type="bodyMd" style={styles.subtitle}>
          Start learning English through real-world situations.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={() => router.replace("/pages/homepage")}>
            <ThemedText style={styles.buttonText}>Get Started</ThemedText>
          </Pressable>
        </View>
      </View>
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
    gap: 24,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  title: {
    color: Colors.light.primary,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.01,
  },
  subtitle: {
    color: Colors.light.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 8,
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
  buttonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
