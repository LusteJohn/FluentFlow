import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

export interface TutorialStep {
  number: number;
  title: string;
  description: string;
}

const WELCOMING_PHRASES = [
  "Welcome aboard! Let's get you started.",
  "Hello there! Ready to begin?",
  "Welcome! Here's a quick guide.",
  "Glad to have you! Let's set things up.",
];

export function getWelcomingPhrase(): string {
  const idx = Math.floor(Math.random() * WELCOMING_PHRASES.length);
  return WELCOMING_PHRASES[idx];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    number: 1,
    title: "Import Data Resources",
    description:
      "Open the Settings page from the bottom navigation and tap \"Import All Data\" to load the lessons, vocabulary, and exercises.",
  },
  {
    number: 2,
    title: "Create Your User Profile",
    description:
      "After importing, create your user profile so the app can track your progress, XP, and completed exercises.",
  },
];

interface TutorialModalProps {
  visible: boolean;
  welcomingPhrase: string;
  steps?: TutorialStep[];
  onClose: () => void;
}

export default function TutorialModal({
  visible,
  welcomingPhrase,
  steps = TUTORIAL_STEPS,
  onClose,
}: TutorialModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <SymbolView
                name={{ ios: "hand.wave.fill", android: "waving_hand", web: "waving_hand" } as any}
                size={26}
                tintColor="#15803d"
              />
            </View>
            <ThemedText style={styles.welcomeText}>{welcomingPhrase}</ThemedText>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={8}>
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" } as any}
                size={18}
                tintColor={Colors.light.onSurfaceVariant}
              />
            </Pressable>
          </View>

          <ThemedText style={styles.title}>Getting Started</ThemedText>
          <ThemedText style={styles.subtitle}>
            Follow these steps to set up your account.
          </ThemedText>

          <View style={styles.stepsContainer}>
            {steps.map((step) => (
              <View key={step.number} style={styles.stepRow}>
                <View style={styles.stepNumberCircle}>
                  <ThemedText style={styles.stepNumberText}>{step.number}</ThemedText>
                </View>
                <View style={styles.stepText}>
                  <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
                  <ThemedText style={styles.stepDescription}>
                    {step.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.gotItButton,
              pressed && styles.gotItButtonPressed,
            ]}
            onPress={onClose}>
            <ThemedText style={styles.gotItButtonText}>Got it</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    flex: 1,
    color: Colors.light.onSurface,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceContainer,
  },
  title: {
    color: Colors.light.onSurface,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    marginTop: 4,
  },
  subtitle: {
    color: Colors.light.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  stepsContainer: {
    gap: 12,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#dcfce7",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#15803d",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: "#15803d",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  stepDescription: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  gotItButton: {
    backgroundColor: "#15803d",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  gotItButtonPressed: {
    opacity: 0.8,
  },
  gotItButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
