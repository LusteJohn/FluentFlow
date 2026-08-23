import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type AlertDialogType = "success" | "error" | "warning";

type AlertDialogProps = {
  visible: boolean;
  type: AlertDialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

const SUCCESS_COLOR = "#1ca65a";
const WARNING_COLOR = "#ca8a04";

export default function AlertDialog({
  visible,
  type,
  title,
  message,
  confirmText = "OK",
  cancelText,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const theme = useTheme();

  const accentColor =
    type === "success"
      ? SUCCESS_COLOR
      : type === "warning"
        ? WARNING_COLOR
        : theme.error;
  const borderColor = `${accentColor}cc`;

  const iconName =
    type === "success"
      ? {
          ios: "checkmark.circle.fill",
          android: "check_circle",
          web: "check_circle",
        }
      : type === "warning"
        ? {
            ios: "exclamationmark.triangle.fill",
            android: "warning",
            web: "warning",
          }
        : {
            ios: "xmark.circle.fill",
            android: "error",
            web: "error",
          };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel ?? onConfirm}
      hardwareAccelerated
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.backdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onConfirm}
          />
        </Animated.View>

        <View style={styles.center}>
          <Animated.View
            entering={FadeInUp.duration(250).springify().delay(100)}
            exiting={FadeOutDown.duration(200)}
            style={[
              styles.dialog,
              {
                backgroundColor: theme.surfaceContainerHigh,
                shadowColor: theme.onSurface,
              },
            ]}
          >
            <View style={styles.content}>
              <SymbolView
                name={iconName as any}
                size={64}
                tintColor={accentColor}
              />
              <ThemedText
                type="subtitle"
                style={[styles.title, { color: theme.onSurface }]}
              >
                {title}
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.message, { color: theme.onSurfaceVariant }]}
              >
                {message}
              </ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: accentColor,
                    borderBottomColor: borderColor,
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onConfirm}
              >
                <ThemedText
                  style={[styles.buttonText, { color: theme.onPrimary }]}
                >
                  {confirmText}
                </ThemedText>
              </Pressable>
              {cancelText && (
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={onCancel ?? onConfirm}
                >
                  <ThemedText
                    style={[styles.cancelButtonText, { color: theme.onSurfaceVariant }]}
                  >
                    {cancelText}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
  },
  dialog: {
    width: "100%",
    borderRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  content: {
    alignItems: "center",
    padding: 28,
    gap: 16,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
  },
  message: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    minWidth: 120,
    width: "100%",
  },
  buttonPressed: {
    borderBottomWidth: 0,
    transform: [{ translateY: 3 }],
  },
   buttonText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
   cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
    minWidth: 120,
    width: "100%",
  },
   cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
});
