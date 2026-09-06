import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { getDatabase } from "@/database/database";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ThemeMode;
  theme: typeof Colors.light;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  theme: Colors.light,
  setMode: async () => {},
});

const APP_KV_THEME_KEY = "app_theme_mode";

async function getStoredThemeMode(): Promise<ThemeMode> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      "SELECT value FROM app_kv WHERE key = ?",
      APP_KV_THEME_KEY,
    );
    const value = row?.value;
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch (e) {
    console.warn("Failed to load theme mode", e);
  }
  return "system";
}

async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO app_kv (key, value) VALUES (?, ?)",
      APP_KV_THEME_KEY,
      mode,
    );
  } catch (e) {
    console.warn("Failed to save theme mode", e);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getStoredThemeMode();
      if (!cancelled) {
        setModeState(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedTheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await setStoredThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedTheme,
        theme: Colors[resolvedTheme],
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context.theme;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  return {
    mode: context.mode,
    resolvedTheme: context.resolvedTheme,
    setMode: context.setMode,
  };
}
