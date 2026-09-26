import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { MenuIcon, NextIcon, PrevIcon, SmileyFaceIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { BackButton } from "@/components/BackButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTheme } from "@/theme/ThemeProvider";

function BarButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className="h-10 flex-1 items-center justify-center"
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      {children}
    </Pressable>
  );
}

export function GameBottomBar({
  onOpenMenu,
  onOpenReactions,
  canReact,
  onPrevMove,
  onNextMove,
  canPrevMove,
  canNextMove,
}: {
  onOpenMenu: () => void;
  onOpenReactions: () => void;
  canReact: boolean;
  onPrevMove: () => void;
  onNextMove: () => void;
  canPrevMove: boolean;
  canNextMove: boolean;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  return (
    <View
      className="flex-row items-center justify-around gap-2 border-t pt-2"
      style={{ borderColor: palette.hairline }}
    >
      <BarButton label="Leave game" onPress={() => setShowLeaveConfirm(true)}>
        <BackButtonGlyph color={palette.mutedForeground} />
      </BarButton>

      <BarButton label="Game menu" onPress={onOpenMenu}>
        <MenuIcon size={16} color={palette.mutedForeground} />
      </BarButton>

      <BarButton label="Send a reaction" onPress={onOpenReactions} disabled={!canReact}>
        <SmileyFaceIcon size={24} color={palette.mutedForeground} />
      </BarButton>

      <BarButton label="Previous move" onPress={onPrevMove} disabled={!canPrevMove}>
        <PrevIcon size={16} color={palette.mutedForeground} />
      </BarButton>

      <BarButton label="Next move" onPress={onNextMove} disabled={!canNextMove}>
        <NextIcon size={16} color={palette.mutedForeground} />
      </BarButton>

      <ConfirmDialog
        open={showLeaveConfirm}
        title="Leave the game?"
        description={"The game will continue without you.\nYou can rejoin anytime."}
        confirmLabel="Exit"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          router.push("/");
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </View>
  );
}

function BackButtonGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 48 38" fill="none">
      <Path d="M21.6567 2.82837L5.65674 18.8284L21.6567 34.8284" stroke={color} strokeWidth={6} />
      <Path d="M5.65674 18.8284H47.6567" stroke={color} strokeWidth={6} />
    </Svg>
  );
}
