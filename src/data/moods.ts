import { Balloon, SmilePlus, MessageCircle, Heart, Flame, Skull } from "lucide-react-native";

export type GameMood = "casual" | "funny" | "deep" | "flirty" | "spicy" | "extreme";

export interface MoodConfig {
  key: GameMood;
  emoji: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  accentColor: string;
  bgColor: string;
  cardColor: string;
  borderColor: string;
  textColor: string;
  subColor: string;
  tags: string[];
}

export const MOODS: MoodConfig[] = [
  {
    key: "casual",
    emoji: "🎈",
    icon: "Balloon",
    label: "Casual",
    description: "Light & easy",
    color: "#0ea5e9",
    accentColor: "#38bdf8",
    bgColor: "#f0f9ff",
    cardColor: "#ffffff",
    borderColor: "#e0f2fe",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["fun"],
  },
  {
    key: "funny",
    emoji: "😂",
    icon: "SmilePlus",
    label: "Funny",
    description: "Silly & laughs",
    color: "#eab308",
    accentColor: "#facc15",
    bgColor: "#fefce8",
    cardColor: "#ffffff",
    borderColor: "#fef9c3",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["fun"],
  },
  {
    key: "deep",
    emoji: "💬",
    icon: "MessageCircle",
    label: "Deep",
    description: "Meaningful talks",
    color: "#06b6d4",
    accentColor: "#22d3ee",
    bgColor: "#ecfeff",
    cardColor: "#ffffff",
    borderColor: "#cffafe",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["deep", "life"],
  },
  {
    key: "flirty",
    emoji: "❤️",
    icon: "Heart",
    label: "Flirty",
    description: "Playful romance",
    color: "#ec4899",
    accentColor: "#f43f5e",
    bgColor: "#fdf2f8",
    cardColor: "#ffffff",
    borderColor: "#fce7f3",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["hot", "connect"],
  },
  {
    key: "spicy",
    emoji: "🌶️",
    icon: "Flame",
    label: "Spicy",
    description: "Bold & daring",
    color: "#f97316",
    accentColor: "#ef4444",
    bgColor: "#fff7ed",
    cardColor: "#ffffff",
    borderColor: "#fed7aa",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["spicy", "hot"],
  },
  {
    key: "extreme",
    emoji: "💀",
    icon: "Skull",
    label: "Extreme",
    description: "Maximum chaos",
    color: "#7c3aed",
    accentColor: "#a855f7",
    bgColor: "#f5f3ff",
    cardColor: "#ffffff",
    borderColor: "#ede9fe",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["spicy", "deep", "hot"],
  },
];

export function getMoodConfig(mood: GameMood): MoodConfig {
  return MOODS.find((m) => m.key === mood) ?? MOODS[0];
}
