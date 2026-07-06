export const COLORS = {
  bg: "#0b081c",
  bgTop: "#0A0B1F",
  bgMid: "#171332",
  bgBottom: "#090912",
  card: "rgba(23, 19, 50, 0.85)",
  cardDark: "rgba(23, 19, 50, 0.95)",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.15)",
  text: "#ffffff",
  sub: "#a19bb3",
  subAlt: "#7c7890",
  purple: "#8338ec",
  purpleLight: "rgba(131, 56, 236, 0.15)",
  purpleGlow: "rgba(131, 56, 236, 0.4)",
  pink: "#ff006e",
  pinkLight: "rgba(255, 0, 110, 0.15)",
  pinkGlow: "rgba(255, 0, 110, 0.4)",
  magenta: "#c026d3",
  blue: "#3b82f6",
  electricBlue: "#06b6d4",
  orange: "#f97316",
  gold: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  softWhite: "rgba(255, 255, 255, 0.9)",
  glassBg: "rgba(23, 19, 50, 0.6)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
};

export const SHADOWS = {
  card: {
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  pinkGlow: {
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const GRADIENTS = {
  hero: { start: "#171332", end: "#ff006e" },
  quickMatch: { start: "#1a1040", end: "#2d1b69" },
  privateGame: { start: "#1a0a12", end: "#2d1540" },
  primary: { start: COLORS.purple, end: COLORS.pink },
};

export const RADIUS = {
  card: 28,
  cardSm: 20,
  pill: 24,
  button: 16,
  small: 12,
  icon: 16,
  avatar: 56,
};
