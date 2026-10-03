import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
  });

  const image = <Image style={styles.image} source={require('@/assets/images/logo.jpeg')} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

const GLOW_ROTATION_DURATION = 60 * 1000 * 4;

// The scale, fade, and rotation run as animated styles rather than `entering`
// keyframes: layout animations own `transform`, which Reanimated warns can
// overwrite.
export function AnimatedIcon() {
  const backgroundScale = useSharedValue(INITIAL_SCALE_FACTOR);
  const logoScale = useSharedValue(1.3);
  const logoOpacity = useSharedValue(0);
  const glowRotation = useSharedValue(0);

  useEffect(() => {
    backgroundScale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(0.7),
    });
    logoScale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(0.7),
    });
    logoOpacity.value = withDelay(
      DURATION * 0.4,
      withTiming(1, { duration: DURATION * 0.6 }),
    );
    glowRotation.value = withRepeat(
      withTiming(7200, {
        duration: GLOW_ROTATION_DURATION,
        easing: Easing.linear,
      }),
      -1,
    );
  }, [backgroundScale, logoScale, logoOpacity, glowRotation]);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${glowRotation.value}deg` }],
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.glow, glowStyle]}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={[styles.background, backgroundStyle]} />
      <Animated.View style={[styles.imageContainer, logoStyle]}>
        <Image style={styles.image} source={require('@/assets/images/logo.jpeg')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
