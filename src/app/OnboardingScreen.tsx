import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useContext, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    withRepeat,
    withTiming
} from "react-native-reanimated";

import { TabBarContext } from "@/components/app-tabs";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/contexts/theme-context";

export default function OnboardingScreen({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}) {
  const { setIsTabBarHidden } = useContext(TabBarContext);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useFocusEffect(() => {
    setIsTabBarHidden(true);
    return () => setIsTabBarHidden(false);
  });

  const blob1Style = useAnimatedStyle(() => {
    const progress = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return {
      transform: [
        { translateX: progress * 30 },
        { translateY: progress * -50 },
        { scale: 1 + progress * 0.1 },
      ],
    };
  });

  const blob2Style = useAnimatedStyle(() => {
    const progress = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return {
      transform: [
        { translateX: progress * -20 },
        { translateY: progress * 20 },
        { scale: 1 - progress * 0.1 },
      ],
    };
  });

  const bounceStyle = useAnimatedStyle(() => {
    const progress = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return {
      transform: [{ translateY: progress * -20 }],
    };
  });

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.surfaceDim }]}
    >
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { backgroundColor: theme.primaryFixedDim },
          blob1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { backgroundColor: theme.surfaceVariant },
          blob2Style,
        ]}
      />

      <ThemedView style={styles.content}>
        <Animated.View style={[styles.imageContainer, bounceStyle]}>
          <Image
            source={require("@/assets/images/splash.png")}
            style={styles.mascotImage}
            contentFit="contain"
          />
        </Animated.View>

        <ThemedView style={styles.textContainer}>
          <ThemedText
            type="title"
            style={[styles.headline, { color: theme.primary }]}
          >
            Master English{"\n"}in Context
          </ThemedText>
          <ThemedText
            type="default"
            style={[styles.bodyText, { color: theme.onSurfaceVariant }]}
          >
            Learn vocabulary through real-world situations and interactive
            exercises.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.actions}>
          <Pressable
            onPress={onGetStarted}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <ThemedText type="default" style={styles.primaryButtonText}>
              Get Started
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={onSignIn}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <ThemedText type="default" style={styles.secondaryButtonText}>
              Sign In
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
    },
    blob: {
      position: "absolute",
      borderRadius: 9999,
      opacity: 0.5,
    },
    blob1: {
      width: 384,
      height: 384,
      top: "-10%",
      left: "-10%",
    },
    blob2: {
      width: 480,
      height: 480,
      bottom: "-10%",
      right: "-10%",
    },
    content: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 32,
      maxWidth: 448,
      alignSelf: "center",
      width: "100%",
    },
    imageContainer: {
      marginBottom: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    mascotImage: {
      width: 256,
      height: 256,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    textContainer: {
      alignItems: "center",
      marginBottom: 32,
      width: "100%",
    },
    headline: {
      textAlign: "center",
      marginBottom: 12,
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700",
    },
    bodyText: {
      textAlign: "center",
      maxWidth: 280,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "500",
    },
    actions: {
      width: "100%",
      gap: 12,
      marginTop: "auto",
    },
    primaryButton: {
      width: "100%",
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      borderBottomWidth: 3,
      borderBottomColor: theme.primaryContainer,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryButtonPressed: {
      borderBottomWidth: 0,
      transform: [{ translateY: 3 }],
    },
    secondaryButton: {
      width: "100%",
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    secondaryButtonPressed: {
      backgroundColor: theme.surfaceContainer,
    },
    primaryButtonText: {
      color: theme.onPrimary,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "500",
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "500",
    },
  });
}
