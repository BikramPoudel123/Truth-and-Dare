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
    color: "#3b82f6",
    accentColor: "#60a5fa",
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
    color: "#2563eb",
    accentColor: "#3b82f6",
    bgColor: "#eff6ff",
    cardColor: "#ffffff",
    borderColor: "#dbeafe",
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
    color: "#1d4ed8",
    accentColor: "#2563eb",
    bgColor: "#eff6ff",
    cardColor: "#ffffff",
    borderColor: "#bfdbfe",
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
    color: "#dc2626",
    accentColor: "#ef4444",
    bgColor: "#fef2f2",
    cardColor: "#ffffff",
    borderColor: "#fecaca",
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
    color: "#dc2626",
    accentColor: "#b91c1c",
    bgColor: "#fef2f2",
    cardColor: "#ffffff",
    borderColor: "#fecaca",
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
    color: "#1e40af",
    accentColor: "#3b82f6",
    bgColor: "#eff6ff",
    cardColor: "#ffffff",
    borderColor: "#bfdbfe",
    textColor: "#0f172a",
    subColor: "#64748b",
    tags: ["spicy", "deep", "hot"],
  },
];

export function getMoodConfig(mood: GameMood): MoodConfig {
  return MOODS.find((m) => m.key === mood) ?? MOODS[0];
}
