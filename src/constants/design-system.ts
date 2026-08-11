export const LIGHT_COLORS = {
  bg: "#ffffff",
  bgTop: "#ffffff",
  bgMid: "#f7f7f8",
  bgBottom: "#ffffff",
  card: "#ffffff",
  cardDark: "#f5f5f6",
  surface: "#f5f5f6",
  surfaceLight: "#f0f0f2",
  surfaceDark: "#e8e8ec",
  input: "#f5f5f6",
  border: "rgba(0, 0, 0, 0.08)",
  borderLight: "rgba(0, 0, 0, 0.14)",
  text: "#1c1c1e",
  textOnDark: "#ffffff",
  sub: "#5c5c66",
  subAlt: "#8a8a94",
  purple: "#fd267a",
  purpleLight: "rgba(253, 38, 122, 0.12)",
  purpleGlow: "rgba(253, 38, 122, 0.3)",
  pink: "#fd267a",
  pinkLight: "rgba(253, 38, 122, 0.12)",
  pinkGlow: "rgba(253, 38, 122, 0.3)",
  magenta: "#fd267a",
  blue: "#fd267a",
  electricBlue: "#fd267a",
  orange: "#ff6036",
  gold: "#ffb100",
  green: "#34c271",
  red: "#ff4d4d",
  truth: "#fd267a",
  dare: "#ff6036",
  brand: "#fd267a",
  brandLight: "rgba(253, 38, 122, 0.12)",
  brandGlow: "rgba(253, 38, 122, 0.3)",
  softWhite: "#1c1c1e",
  glassBg: "#f0f0f2",
  glassBorder: "rgba(0, 0, 0, 0.1)",
  levelBarBg: "rgba(0, 0, 0, 0.08)",
  navBg: "#ffffff",
  navActiveBg: "#fd267a",
} as const;

export type ThemeColors = { readonly [K in keyof typeof LIGHT_COLORS]: string };

export const COLORS = LIGHT_COLORS;

export const LIGHT_SHADOWS = {
  card: {
    shadowColor: "#fd267a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  glow: {
    shadowColor: "#fd267a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  pinkGlow: {
    shadowColor: "#fd267a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const SHADOWS = LIGHT_SHADOWS;

export const GRADIENTS = {
  hero: { start: "#fd267a", end: "#ff6036" },
  quickMatch: { start: "#fd267a", end: "#ff6fa8" },
  privateGame: { start: "#ff6036", end: "#fd267a" },
  primary: { start: "#fd267a", end: "#ff6036" },
  match: { start: "#fd267a", end: "#ff6036" },
};

export const RADIUS = {
  card: 30,
  cardSm: 20,
  pill: 24,
  button: 16,
  small: 12,
  icon: 16,
  avatar: 56,
};
