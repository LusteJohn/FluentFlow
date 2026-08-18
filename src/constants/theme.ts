/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#0058be',
    onPrimary: '#ffffff',
    primaryContainer: '#2170e4',
    onPrimaryContainer: '#fefcff',
    primaryFixed: '#d8e2ff',
    primaryFixedDim: '#adc6ff',
    onPrimaryFixed: '#001a42',
    onPrimaryFixedVariant: '#004395',
    secondary: '#795900',
    onSecondary: '#ffffff',
    secondaryContainer: '#ffc329',
    onSecondaryContainer: '#6f5100',
    secondaryFixed: '#ffdf9f',
    secondaryFixedDim: '#f9bd22',
    onSecondaryFixed: '#261a00',
    onSecondaryFixedVariant: '#5c4300',
    tertiary: '#924700',
    onTertiary: '#ffffff',
    tertiaryContainer: '#b75b00',
    onTertiaryContainer: '#fffbff',
    tertiaryFixed: '#ffdcc6',
    tertiaryFixedDim: '#ffb786',
    onTertiaryFixed: '#311400',
    onTertiaryFixedVariant: '#723600',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    surface: '#f8f9ff',
    onSurface: '#0b1c30',
    surfaceVariant: '#d3e4fe',
    onSurfaceVariant: '#424754',
    surfaceBright: '#f8f9ff',
    surfaceContainer: '#e5eeff',
    surfaceContainerHigh: '#dce9ff',
    surfaceContainerHighest: '#d3e4fe',
    surfaceContainerLow: '#eff4ff',
    surfaceContainerLowest: '#ffffff',
    surfaceDim: '#cbdbf5',
    background: '#f8f9ff',
    onBackground: '#0b1c30',
    inverseSurface: '#213145',
    inverseOnSurface: '#eaf1ff',
    inversePrimary: '#adc6ff',
    outline: '#727785',
    outlineVariant: '#c2c6d6',
    surfaceTint: '#005ac2',
    backgroundElement: '#dce9ff',
    backgroundSelected: '#d3e4fe',
    textSecondary: '#424754',
  },
  dark: {
    primary: '#adc6ff',
    onPrimary: '#002e69',
    primaryContainer: '#004395',
    onPrimaryContainer: '#d8e2ff',
    primaryFixed: '#005ac2',
    primaryFixedDim: '#004395',
    onPrimaryFixed: '#d8e2ff',
    onPrimaryFixedVariant: '#adc6ff',
    secondary: '#f9bd22',
    onSecondary: '#3e2e00',
    secondaryContainer: '#5c4300',
    onSecondaryContainer: '#ffdf9f',
    secondaryFixed: '#f9bd22',
    secondaryFixedDim: '#c78e00',
    onSecondaryFixed: '#261a00',
    onSecondaryFixedVariant: '#5c4300',
    tertiary: '#ffb786',
    onTertiary: '#4a2800',
    tertiaryContainer: '#723600',
    onTertiaryContainer: '#ffdcc6',
    tertiaryFixed: '#ffb786',
    tertiaryFixedDim: '#c78e00',
    onTertiaryFixed: '#311400',
    onTertiaryFixedVariant: '#723600',
    error: '#ffb4ab',
    onError: '#690005',
    errorContainer: '#93000a',
    onErrorContainer: '#ffdad6',
    surface: '#0b1c30',
    onSurface: '#eaf1ff',
    surfaceVariant: '#213145',
    onSurfaceVariant: '#c2c6d6',
    surfaceBright: '#2a3145',
    surfaceContainer: '#0f2035',
    surfaceContainerHigh: '#192a40',
    surfaceContainerHighest: '#23354b',
    surfaceContainerLow: '#0a192c',
    surfaceContainerLowest: '#040f1f',
    surfaceDim: '#0b1c30',
    background: '#0b1c30',
    onBackground: '#eaf1ff',
    inverseSurface: '#eaf1ff',
    inverseOnSurface: '#213145',
    inversePrimary: '#005ac2',
    outline: '#8b8e98',
    outlineVariant: '#424754',
    surfaceTint: '#adc6ff',
    backgroundElement: '#192a40',
    backgroundSelected: '#23354b',
    textSecondary: '#c2c6d6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
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
