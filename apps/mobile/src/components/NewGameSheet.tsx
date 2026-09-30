import { createGameFn, useSession } from "@word-lock/client";
import { TIME_CONTROLS, type TimeControl } from "@word-lock/core/game";
import { ClockIcon, CrossIcon, StarIcon, StreakIcon, SunIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Text, textClass } from "@/components/text";
import { toast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";

const BANK = TIME_CONTROLS.filter((c) => c.group === "bank");
const DAILY = TIME_CONTROLS.filter((c) => c.group === "daily");

// Placeholder artwork until the modes get icons of their own.
function iconFor(id: TimeControl, color: string): ReactNode {
  switch (id) {
    case "10m":
      return <StreakIcon size={24} />;
    case "30m":
      return <ClockIcon size={24} color={color} />;
    case "60m":
      return <StarIcon size={24} color={color} />;
    case "daily":
      return <SunIcon size={20} color={color} />;
  }
}

/**
 * Native counterpart of `apps/web`'s `NewGameSheet.tsx`: every "New Game"
 * button opens this instead of creating a room directly, so the host always
 * picks the pace before anyone is invited.
 */
export function NewGameSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const { sessionId, ready } = useSession();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [selected, setSelected] = useState<TimeControl>("10m");

  const createMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId: sessionId!, timeControl: selected }),
    onSuccess: ({ roomCode }: { roomCode: string }) => {
      onClose();
      onCreated?.();
      router.push(`/game/${roomCode}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const labelColor = (id: TimeControl) => (selected === id ? "#ffffff" : palette.foreground);
  const label = (id: TimeControl, text: string) => (
    <Text className={textClass("buttonSm")} style={{ color: labelColor(id) }}>
      {text}
    </Text>
  );

  return (
    <BottomSheet open={open} onClose={onClose} label="New game" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4">
        <Text variant="sheetTitle">New game</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <Text variant="body" className="mt-6">
        Each player&apos;s clock
      </Text>
      <View className="mt-3 flex-row gap-3">
        {BANK.map((c) => (
          <View key={c.id} className="flex-1">
            <Button
              variant={selected === c.id ? "mint" : "surface"}
              size="sm"
              accessibilityState={{ selected: selected === c.id }}
              onPress={() => setSelected(c.id)}
            >
              <View className="items-center gap-2 py-1.5">
                {iconFor(c.id, labelColor(c.id))}
                {label(c.id, c.label)}
              </View>
            </Button>
          </View>
        ))}
      </View>

      <Text variant="body" className="mt-6">
        Take your time
      </Text>
      {DAILY.map((c) => (
        <View key={c.id} className="mt-3">
          <Button
            variant={selected === c.id ? "mint" : "surface"}
            size="sm"
            accessibilityState={{ selected: selected === c.id }}
            onPress={() => setSelected(c.id)}
            icon={iconFor(c.id, labelColor(c.id))}
          >
            <View className="py-1.5">{label(c.id, c.label)}</View>
          </Button>
        </View>
      ))}

      <View className="mt-8">
        <Button
          variant="sky"
          size="sheet"
          disabled={!ready || createMutation.isPending}
          loading={createMutation.isPending}
          loadingText="Creating"
          onPress={() => createMutation.mutate()}
        >
          Create room
        </Button>
      </View>
    </BottomSheet>
  );
}
