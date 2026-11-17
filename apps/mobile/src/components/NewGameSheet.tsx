import { createGameFn, useSession } from "@word-lock/client";
import { TIME_CONTROLS, type TimeControl } from "@word-lock/core/game";
import { CrossIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Text, textClass } from "@/components/text";
import { toast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";

import MODE_5M from "../../assets/christmas/modes/mode-5m.webp";
import MODE_10M from "../../assets/christmas/modes/mode-10m.webp";
import MODE_15M from "../../assets/christmas/modes/mode-15m.webp";

const ICONS: Record<TimeControl, number> = { "5m": MODE_5M, "10m": MODE_10M, "15m": MODE_15M };

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
      <View className="flex-row justify-end">
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>
      <View className="mt-10 flex-row gap-3">
        {TIME_CONTROLS.map((c) => (
          <View key={c.id} className="flex-1">
            <Button
              variant={selected === c.id ? "sky" : "surface"}
              size="sm"
              accessibilityState={{ selected: selected === c.id }}
              onPress={() => setSelected(c.id)}
            >
              <View className="items-center gap-3 py-4">
                <Image
                  source={ICONS[c.id]}
                  contentFit="contain"
                  style={{ width: 28, height: 28 }}
                />
                {label(c.id, c.label)}
              </View>
            </Button>
          </View>
        ))}
      </View>

      <View className="mt-10">
        <Button
          variant="mint"
          size="sheet"
          disabled={!ready || createMutation.isPending}
          loading={createMutation.isPending}
          loadingText="Creating"
          onPress={() => createMutation.mutate()}
        >
          Start game
        </Button>
      </View>
    </BottomSheet>
  );
}
