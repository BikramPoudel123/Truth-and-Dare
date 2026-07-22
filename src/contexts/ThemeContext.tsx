import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DARK_COLORS, LIGHT_COLORS, DARK_SHADOWS, LIGHT_SHADOWS, type ThemeColors } from "@/constants/design-system";

type ThemeShadows = typeof DARK_SHADOWS;

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  shadows: ThemeShadows;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  colors: LIGHT_COLORS,
  shadows: LIGHT_SHADOWS,
});

const THEME_KEY = "@truthdare_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val !== null) setIsDark(val === "dark");
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light").catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    isDark,
    toggleTheme,
    colors: (isDark ? DARK_COLORS : LIGHT_COLORS) as ThemeColors,
    shadows: (isDark ? DARK_SHADOWS : LIGHT_SHADOWS) as ThemeShadows,
  }), [isDark, toggleTheme]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
