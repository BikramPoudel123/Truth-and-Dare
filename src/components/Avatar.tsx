import { useMemo, useState } from "react";
import { Image } from "expo-image";
import { ImageStyle, StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  initialsBgColor?: string;
  initialsTextColor?: string;
  style?: StyleProp<ViewStyle | ImageStyle>;
  onPress?: () => void;
}

export function Avatar({
  uri, name, size = 36, borderWidth = 1.5, borderColor,
  initialsBgColor, initialsTextColor,
  style, onPress,
}: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const showInitials = !uri || failed;

  const source = useMemo(() => (uri ? { uri } : null), [uri]);

  const initialsStyle: ViewStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: initialsBgColor ?? `${colors.purple}25`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth,
    borderColor: borderColor ?? colors.border,
  }), [size, initialsBgColor, borderWidth, borderColor, colors.purple, colors.border]);

  const imageStyle: ImageStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor: borderColor ?? colors.border,
  }) as ImageStyle, [size, borderWidth, borderColor, colors.border]);

  const initialsTextStyle = useMemo(() => ({
    color: initialsTextColor ?? colors.purple,
    fontSize: size * 0.4,
    fontWeight: "800" as const,
  }), [initialsTextColor, size, colors.purple]);

  if (showInitials) {
    const inner = (
      <View style={[initialsStyle, style]}>
        <Text style={initialsTextStyle}>
          {name.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {inner}
        </TouchableOpacity>
      );
    }
    return inner;
  }

  const inner = source ? (
    <Image
      source={source}
      style={[imageStyle, style] as any}
      onError={() => setFailed(true)}
    />
  ) : (
    <View style={[initialsStyle, style]}>
      <Text style={initialsTextStyle}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}
