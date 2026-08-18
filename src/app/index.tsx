import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const COLORS = {
  primary: '#0058be',
  primaryFixed: '#d8e2ff',
  primaryFixedDim: '#adc6ff',
  surface: '#f8f9ff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#424754',
  outlineVariant: '#c2c6d6',
  primaryContainer: '#2170e4',
  onPrimary: '#ffffff',
  surfaceVariant: '#d3e4fe',
};

export default function HomeScreen() {
  const blob1Style = useAnimatedStyle(() => {
    const progress = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
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
      true
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
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return {
      transform: [{ translateY: progress * -10 }],
    };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: COLORS.surface }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.blob, styles.blob1, { backgroundColor: COLORS.primaryFixedDim }, blob1Style]} />
        <Animated.View style={[styles.blob, styles.blob2, { backgroundColor: COLORS.surfaceVariant }, blob2Style]} />

        <ThemedView style={styles.content}>
          <Animated.View style={[styles.imageContainer, bounceStyle]}>
            <Image
              source={require('@/assets/images/splash.png')}
              style={styles.mascotImage}
              contentFit="contain"
            />
          </Animated.View>

          <ThemedView style={styles.textContainer}>
            <ThemedText type="title" style={[styles.headline, { color: COLORS.primary }]}>
              Master English{'\n'}in Context!
            </ThemedText>
            <ThemedText type="default" style={[styles.bodyText, { color: COLORS.onSurfaceVariant }]}>
              Learn vocabulary through real-world situations and interactive exercises.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}>
              <ThemedText type="default" style={styles.primaryButtonText}>
                Get Started
              </ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryButton}>
              <ThemedText type="default" style={styles.secondaryButtonText}>
                Sign In
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.5,
  },
  blob1: {
    width: 384,
    height: 384,
    top: '-10%',
    left: '-10%',
  },
  blob2: {
    width: 480,
    height: 480,
    bottom: '-10%',
    right: '-10%',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  imageContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 256,
    height: 256,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  headline: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  bodyText: {
    textAlign: 'center',
    maxWidth: 280,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 'auto',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primaryContainer,
  },
  primaryButtonPressed: {
    borderBottomWidth: 0,
    transform: [{ translateY: 3 }],
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  primaryButtonText: {
    color: COLORS.onPrimary,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
});
