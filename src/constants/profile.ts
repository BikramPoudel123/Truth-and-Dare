import { Crown, Flame, Heart, PartyPopper, Skull, SmilePlus, Star, Zap } from "lucide-react-native";
import { COLORS } from "@/constants/design-system";

export const INTEREST_LABEL: Record<string, string> = {
  "fun": "fun",
  "life": "life",
  "hot": "hot",
  "connect": "connect",
  "spicy": "spicy",
  "deep": "deep",
};

export const PLAY_STYLE_ICON_MAP: Record<string, [React.ComponentType<{ size: number; color: string }>, string]> = {
  "Rising Star":       [Star, COLORS.gold],
  "Hot Player":        [Flame, COLORS.orange],
  "Funny Player":      [SmilePlus, "#facc15"],
  "Heartthrob":        [Heart, COLORS.pink],
  "Shocking Player":   [Zap, COLORS.electricBlue],
  "Savage Player":     [Skull, "#a855f7"],
  "Emotional Player":  [Heart, "#60a5fa"],
  "Life of the Party": [PartyPopper, "#f97316"],
  "Respected Player":  [Crown, COLORS.gold],
};
