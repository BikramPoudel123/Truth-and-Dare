import { useMemo, useState } from "react";
import { Image } from "expo-image";
import { ImageStyle, StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { COLORS } from "@/constants/design-system";

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
  uri, name, size = 36, borderWidth = 1.5, borderColor = COLORS.border,
  initialsBgColor, initialsTextColor = COLORS.purple,
  style, onPress,
}: Props) {
  const [failed, setFailed] = useState(false);
  const showInitials = !uri || failed;

  const source = useMemo(() => (uri ? { uri } : null), [uri]);

  const initialsStyle: ViewStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: initialsBgColor ?? `${COLORS.purple}25`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth,
    borderColor,
  }), [size, initialsBgColor, borderWidth, borderColor]);

  const imageStyle: ImageStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor,
  }) as ImageStyle, [size, borderWidth, borderColor]);

  const initialsTextStyle = useMemo(() => ({
    color: initialsTextColor,
    fontSize: size * 0.4,
    fontWeight: "800" as const,
  }), [initialsTextColor, size]);

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
