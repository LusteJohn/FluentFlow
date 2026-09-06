import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, {
  Easing,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { TabBarContext } from "@/components/app-tabs";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/contexts/theme-context";

export default function HomeScreen() {
  const router = useRouter();
  const { setIsTabBarHidden } = useContext(TabBarContext);
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
    },
    safeArea: {
      flex: 1,
      position: "relative",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 32,
    },
    ambientShape: {
      position: "absolute",
      borderRadius: 9999,
      opacity: 0.5,
    },
    ambientShape1: {
      width: 400,
      height: 400,
      top: "-10%",
      left: "-15%",
    },
    ambientShape2: {
      width: 350,
      height: 350,
      top: "20%",
      right: "-10%",
    },
    ambientShape3: {
      width: 500,
      height: 500,
      bottom: "-10%",
      left: "10%",
    },
    imageContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
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
      gap: 12,
    },
    headline: {
      textAlign: "center",
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700",
      letterSpacing: -0.24,
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
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 9999,
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
    primaryButtonText: {
      color: theme.onPrimary,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "600",
    },
    secondaryButton: {
      width: "100%",
      backgroundColor: theme.surface,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 9999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    secondaryButtonPressed: {
      backgroundColor: theme.surfaceContainer,
      transform: [{ translateY: 2 }],
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "600",
    },
    footerNote: {
      width: "100%",
      alignItems: "center",
      marginTop: 12,
    },
    footerText: {
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
  }), [theme]);

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

  const blob3Style = useAnimatedStyle(() => {
    const progress = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return {
      transform: [
        { translateX: progress * -15 },
        { translateY: progress * 15 },
        { scale: 1 + progress * 0.05 },
      ],
    };
  });

  const bounceStyle = useAnimatedStyle(() => {
    const progress = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return {
      transform: [{ translateY: progress * -20 }],
    };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.surface }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.ambientShape,
            styles.ambientShape1,
            { backgroundColor: theme.primaryFixedDim },
            blob1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ambientShape,
            styles.ambientShape2,
            { backgroundColor: theme.secondaryFixed },
            blob2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ambientShape,
            styles.ambientShape3,
            { backgroundColor: theme.surfaceVariant },
            blob3Style,
          ]}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.imageContainer, bounceStyle]}>
            <Image
              source={require("@/assets/images/splash.png")}
              style={styles.mascotImage}
              contentFit="contain"
            />
          </Animated.View>

          <View style={styles.textContainer}>
            <ThemedText
              style={[styles.headline, { color: theme.primary }]}
            >
              Master English{"\n"}in Context
            </ThemedText>
            <ThemedText
              style={[
                styles.bodyText,
                { color: theme.onSurfaceVariant },
              ]}
            >
              Learn vocabulary through real-world situations and interactive
              exercises.
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.replace("/pages/homepage")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
              <SymbolView
                name={{
                  ios: "arrow_right",
                  android: "arrow_forward",
                  web: "arrow_forward",
                }}
                size={20}
                tintColor={theme.onPrimary}
              />
            </Pressable>

            <Pressable
              onPress={() => router.replace("/pages/homepage")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <ThemedText style={styles.secondaryButtonText}>Sign In</ThemedText>
            </Pressable>
          </View>

          <View style={styles.footerNote}>
            <ThemedText
              style={[
                styles.footerText,
                { color: theme.outline },
              ]}
            >
              Start your journey today
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
