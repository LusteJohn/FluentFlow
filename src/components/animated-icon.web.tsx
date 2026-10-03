import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import classes from './animated-icon.module.css';
const DURATION = 300;

export function AnimatedSplashOverlay() {
  return null;
}

const GLOW_ROTATION_DURATION = 60 * 1000 * 4;

// The scale, fade, and rotation run as animated styles rather than `entering`
// keyframes: layout animations own `transform`, which Reanimated warns can
// overwrite.
export function AnimatedIcon() {
  const backgroundScale = useSharedValue(0);
  const logoScale = useSharedValue(1.2);
  const logoOpacity = useSharedValue(0);
  const glowRotation = useSharedValue(-180);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    backgroundScale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(1.2),
    });
    logoScale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(1.2),
    });
    logoOpacity.value = withDelay(
      DURATION * 0.6,
      withTiming(1, { duration: DURATION * 0.4 }),
    );
    glowScale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(0.7),
    });
    glowOpacity.value = withDelay(
      DURATION,
      withTiming(1, { duration: DURATION }),
    );
    glowRotation.value = withDelay(
      DURATION,
      withRepeat(
        withTiming(7200, {
          duration: GLOW_ROTATION_DURATION,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
  }, [
    backgroundScale,
    logoScale,
    logoOpacity,
    glowScale,
    glowOpacity,
    glowRotation,
  ]);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { rotateZ: `${glowRotation.value}deg` },
      { scale: glowScale.value },
    ],
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.glow, glowStyle]}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={[styles.background, backgroundStyle]}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={[styles.imageContainer, logoStyle]}>
        <Image style={styles.image} source={require('@/assets/images/logo.jpeg')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
