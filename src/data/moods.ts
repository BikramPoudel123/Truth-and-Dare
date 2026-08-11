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
    color: "#fd267a",
    accentColor: "#fd267a",
    bgColor: "#fff1f2",
    cardColor: "#ffffff",
    borderColor: "#fce7f3",
    textColor: "#0f172a",
    subColor: "#8a8a94",
    tags: ["fun"],
  },
  {
    key: "funny",
    emoji: "😂",
    icon: "SmilePlus",
    label: "Funny",
    description: "Silly & laughs",
    color: "#ff6036",
    accentColor: "#ff9b6b",
    bgColor: "#fff1f2",
    cardColor: "#ffffff",
    borderColor: "#fce7f3",
    textColor: "#0f172a",
    subColor: "#8a8a94",
    tags: ["fun"],
  },
  {
    key: "deep",
    emoji: "💬",
    icon: "MessageCircle",
    label: "Deep",
    description: "Meaningful talks",
    color: "#fd267a",
    accentColor: "#fd267a",
    bgColor: "#fff1f2",
    cardColor: "#ffffff",
    borderColor: "#fecdd3",
    textColor: "#0f172a",
    subColor: "#8a8a94",
    tags: ["deep", "life"],
  },
  {
    key: "flirty",
    emoji: "❤️",
    icon: "Heart",
    label: "Flirty",
    description: "Playful romance",
    color: "#fd267a",
    accentColor: "#ff6fa8",
    bgColor: "#fef2f2",
    cardColor: "#ffffff",
    borderColor: "#fecaca",
    textColor: "#0f172a",
    subColor: "#8a8a94",
    tags: ["hot", "connect"],
  },
  {
    key: "spicy",
    emoji: "🌶️",
    icon: "Flame",
    label: "Spicy",
    description: "Bold & daring",
    color: "#ff4d4d",
    accentColor: "#ff6036",
    bgColor: "#fef2f2",
    cardColor: "#ffffff",
    borderColor: "#fecaca",
    textColor: "#0f172a",
    subColor: "#8a8a94",
    tags: ["spicy", "hot"],
  },
  {
    key: "extreme",
    emoji: "💀",
    icon: "Skull",
    label: "Extreme",
    description: "Maximum chaos",
    color: "#fd267a",
    accentColor: "#fd267a",
    bgColor: "#fff1f2",
    cardColor: "#ffffff",
    borderColor: "#fecdd3",
    textColor: "#0f172a",
    subColor: "#8a8a94",
    tags: ["spicy", "deep", "hot"],
  },
];

export function getMoodConfig(mood: GameMood): MoodConfig {
  return MOODS.find((m) => m.key === mood) ?? MOODS[0];
}
