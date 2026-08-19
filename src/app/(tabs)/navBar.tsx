import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

export default function NavBar() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push("/pages/homepage")}
      >
        <ThemedText type="default" style={styles.buttonText}>
          Homepage
        </ThemedText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push("/pages/journey")}
      >
        <ThemedText type="default" style={styles.buttonText}>
          Journey
        </ThemedText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push("/pages/setting")}
      >
        <ThemedText type="default" style={styles.buttonText}>
          Settings
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 30,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outline,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primaryContainer,
    marginHorizontal: 8,
  },
  buttonPressed: {
    borderBottomWidth: 0,
    transform: [{ translateY: 3 }],
  },
  buttonText: {
    color: Colors.light.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
