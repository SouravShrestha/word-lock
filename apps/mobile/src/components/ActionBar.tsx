import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { BackspaceIcon, BinIcon, EnterIcon, SkipIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { Lip, lipPadding } from "@/components/lip";
import { useTheme } from "@/theme/ThemeProvider";

const LIP = 4;

function ActionButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      needsOffscreenAlphaCompositing={disabled}
      className="w-12 shrink-0 overflow-hidden rounded-full"
      style={{
        height: 48 + LIP,
        opacity: disabled ? 0.35 : 1,
        ...lipPadding(LIP, pressed && !disabled),
      }}
    >
      <Lip depth={palette.depthSurface2} />
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: palette.surface2 }}
      >
        {children}
      </View>
    </Pressable>
  );
}

export function ActionBar({
  yourTurn,
  selectionLength,
  onPass,
  onClear,
  onBackspace,
  onSubmit,
  passPending,
  submitPending,
}: {
  yourTurn: boolean;
  selectionLength: number;
  onPass: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  passPending: boolean;
  submitPending: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <View className="flex-row items-center justify-around gap-4 px-4 py-2">
      <ActionButton label="Pass turn" onPress={onPass} disabled={!yourTurn || passPending}>
        <SkipIcon size={16} color={palette.foreground} />
      </ActionButton>

      <ActionButton
        label="Clear selection"
        onPress={onClear}
        disabled={!yourTurn || selectionLength === 0}
      >
        <BinIcon size={16} color={palette.foreground} />
      </ActionButton>

      <ActionButton
        label="Remove last tile"
        onPress={onBackspace}
        disabled={!yourTurn || selectionLength === 0}
      >
        <BackspaceIcon size={16} color={palette.foreground} />
      </ActionButton>

      <ActionButton
        label="Submit word"
        onPress={onSubmit}
        disabled={!yourTurn || selectionLength < 3 || submitPending}
      >
        <EnterIcon size={16} color={palette.foreground} />
      </ActionButton>
    </View>
  );
}
