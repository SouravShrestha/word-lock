import { Text } from "@/components/text";
import { Pressable, View } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export type TileOwner = 0 | 1 | 2;

interface TileProps {
  letter: string;
  owner: TileOwner;
  locked?: boolean;
  selected?: boolean;
  order?: number | null;
  onPress?: () => void;
  disabled?: boolean;
}

export function Tile({
  letter,
  owner,
  locked = false,
  selected = false,
  onPress,
  disabled,
  isTop = false,
  isLeft = false,
}: TileProps & { isTop?: boolean; isLeft?: boolean }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const fill = selected
    ? palette.primary
    : owner === 0
      ? palette.board
      : owner === 1
        ? palette.p1Soft
        : palette.p2Soft;

  const textColor = selected
    ? palette.onAccent
    : owner === 0
      ? palette.foreground
      : resolvedTheme === "dark"
        ? "#ffffff"
        : owner === 1
          ? palette.p1Deep
          : palette.p2Deep;

  const lockedCircleFill =
    owner === 1 ? palette.p1 : owner === 2 ? palette.p2 : `${palette.card}33`;
  const lockedTextColor = owner === 0 ? textColor : "#ffffff";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Letter ${letter}${locked ? ", locked" : ""}`}
      onPress={onPress}
      disabled={disabled}
      className={`aspect-square w-full items-center justify-center border-b border-r ${
        isTop ? "border-t" : ""
      } ${isLeft ? "border-l" : ""}`}
      style={{ backgroundColor: fill, borderColor: palette.border }}
    >
      {locked ? (
        <View
          className="aspect-square w-[62%] items-center justify-center rounded-full"
          style={{ backgroundColor: lockedCircleFill }}
        >
          <Text
            variant="autoGen27"

            style={{ color: lockedTextColor, fontSize: 16 }}
          >
            {letter}
          </Text>
        </View>
      ) : (
        <Text variant="autoGen28" style={{ color: textColor, fontSize: 16 }}>
          {letter}
        </Text>
      )}
    </Pressable>
  );
}
