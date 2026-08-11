import React, { createContext, useContext, useMemo } from "react";
import { LIGHT_COLORS, LIGHT_SHADOWS, type ThemeColors } from "@/constants/design-system";

type ThemeShadows = typeof LIGHT_SHADOWS;

interface ThemeContextValue {
  colors: ThemeColors;
  shadows: ThemeShadows;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LIGHT_COLORS,
  shadows: LIGHT_SHADOWS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({
    colors: LIGHT_COLORS as ThemeColors,
    shadows: LIGHT_SHADOWS as ThemeShadows,
  }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
