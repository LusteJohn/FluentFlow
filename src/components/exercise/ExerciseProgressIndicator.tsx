import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { useTheme } from "@/contexts/theme-context";

interface ExerciseProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export function ExerciseProgressIndicator({
  current,
  total,
  label,
}: ExerciseProgressIndicatorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.text, { color: theme.onSurfaceVariant }]}
      >
        {label ?? `Exercise ${current + 1} of ${total}`}
      </Animated.Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }, (_, i) => (
          <Dot key={`dot-${i}`} index={i} current={current} />
        ))}
      </View>
    </View>
  );
}

interface DotProps {
  index: number;
  current: number;
}

function Dot({ index, current }: DotProps) {
  const theme = useTheme();
  const state = useSharedValue(getDotState(index, current));
  const activePulse = useSharedValue(0);

  useEffect(() => {
    "worklet";
    const nextState = getDotState(index, current);
    state.value = nextState;
    if (nextState === "active") {
      activePulse.value = withSequence(
        withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      );
    }
  }, [index, current, state, activePulse]);

  const style = useAnimatedStyle(() => {
    const s = state.value;
    const backgroundColor =
      s === "completed"
        ? theme.primary
        : s === "active"
          ? theme.primary
          : theme.surfaceVariant;
    const width =
      s === "active"
        ? DOT_ACTIVE_WIDTH
        : s === "completed"
        ? DOT_COMPLETED_WIDTH
        : DOT_SIZE;

    return {
      backgroundColor,
      width: withTiming(width, {
        duration: DOT_ANIMATION_DURATION,
        easing: Easing.out(Easing.quad),
      }),
      transform: [{ scale: 1 + activePulse.value * 0.15 }],
    };
  }, [state, activePulse, theme]);

  return <Animated.View style={[styles.dot, style]} />;
}

type DotState = "completed" | "active" | "pending";

function getDotState(index: number, current: number): DotState {
  if (index < current) return "completed";
  if (index === current) return "active";
  return "pending";
}

const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 24;
const DOT_COMPLETED_WIDTH = 16;
const DOT_GAP = 6;
const DOT_ANIMATION_DURATION = 200;

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    gap: DOT_GAP,
    alignItems: "center",
    height: DOT_SIZE,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
