/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#15803d",
    onPrimary: "#ffffff",
    primaryContainer: "#22c55e",
    onPrimaryContainer: "#052e16",
    primaryFixed: "#bbf7d0",
    primaryFixedDim: "#86efac",
    onPrimaryFixed: "#052e16",
    onPrimaryFixedVariant: "#166534",
    secondary: "#795900",
    onSecondary: "#ffffff",
    secondaryContainer: "#ffc329",
    onSecondaryContainer: "#6f5100",
    secondaryFixed: "#ffdf9f",
    secondaryFixedDim: "#f9bd22",
    onSecondaryFixed: "#261a00",
    onSecondaryFixedVariant: "#5c4300",
    tertiary: "#924700",
    onTertiary: "#ffffff",
    tertiaryContainer: "#b75b00",
    onTertiaryContainer: "#fffbff",
    tertiaryFixed: "#ffdcc6",
    tertiaryFixedDim: "#ffb786",
    onTertiaryFixed: "#311400",
    onTertiaryFixedVariant: "#723600",
    error: "#ba1a1a",
    onError: "#ffffff",
    errorContainer: "#ffdad6",
    onErrorContainer: "#93000a",
    surface: "#f7fbf8",
    onSurface: "#102116",
    surfaceVariant: "#dcefe2",
    onSurfaceVariant: "#435047",
    surfaceBright: "#f7fbf8",
    surfaceContainer: "#e7f3e9",
    surfaceContainerHigh: "#dff0e3",
    surfaceContainerHighest: "#d5e9da",
    surfaceContainerLow: "#eef7f0",
    surfaceContainerLowest: "#ffffff",
    surfaceDim: "#c9ddce",
    background: "#f7fbf8",
    onBackground: "#102116",
    inverseSurface: "#26382b",
    inverseOnSurface: "#e5f2e7",
    inversePrimary: "#86efac",
    outline: "#737d75",
    outlineVariant: "#c4d3c7",
    surfaceTint: "#15803d",
    backgroundElement: "#dff0e3",
    backgroundSelected: "#d5e9da",
    textSecondary: "#435047",
  },
  dark: {
    primary: "#86efac",
    onPrimary: "#064e1b",
    primaryContainer: "#166534",
    onPrimaryContainer: "#bbf7d0",
    primaryFixed: "#22c55e",
    primaryFixedDim: "#166534",
    onPrimaryFixed: "#052e16",
    onPrimaryFixedVariant: "#86efac",
    secondary: "#f9bd22",
    onSecondary: "#3e2e00",
    secondaryContainer: "#5c4300",
    onSecondaryContainer: "#ffdf9f",
    secondaryFixed: "#f9bd22",
    secondaryFixedDim: "#c78e00",
    onSecondaryFixed: "#261a00",
    onSecondaryFixedVariant: "#5c4300",
    tertiary: "#ffb786",
    onTertiary: "#4a2800",
    tertiaryContainer: "#723600",
    onTertiaryContainer: "#ffdcc6",
    tertiaryFixed: "#ffb786",
    tertiaryFixedDim: "#c78e00",
    onTertiaryFixed: "#311400",
    onTertiaryFixedVariant: "#723600",
    error: "#ffb4ab",
    onError: "#690005",
    errorContainer: "#93000a",
    onErrorContainer: "#ffdad6",
    surface: "#0e1a12",
    onSurface: "#e5f2e7",
    surfaceVariant: "#26382b",
    onSurfaceVariant: "#c4d3c7",
    surfaceBright: "#293b2e",
    surfaceContainer: "#122218",
    surfaceContainerHigh: "#1b2d20",
    surfaceContainerHighest: "#24372a",
    surfaceContainerLow: "#0b1710",
    surfaceContainerLowest: "#061008",
    surfaceDim: "#0e1a12",
    background: "#0e1a12",
    onBackground: "#e5f2e7",
    inverseSurface: "#e5f2e7",
    inverseOnSurface: "#26382b",
    inversePrimary: "#15803d",
    outline: "#8b998e",
    outlineVariant: "#435047",
    surfaceTint: "#86efac",
    backgroundElement: "#1b2d20",
    backgroundSelected: "#24372a",
    textSecondary: "#c4d3c7",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
