import { Text } from "@/components/text";
import { browserTimezone } from "@word-lock/core/account";
import { currentStreak, localDate, streakMessage, streakWeek } from "@word-lock/core/game";
import { CrossIcon, TickIcon } from "@word-lock/icons/native";
import { colors, radius } from "@word-lock/tokens/native";
import { Image } from "expo-image";
import { View } from "react-native";

import STREAK_IMAGE from "../../assets/christmas/streak.png";

import { BottomSheet } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { useTheme } from "@/theme/ThemeProvider";

export function StreakSheet({
  open,
  onClose,
  playStreak,
  lastPlayedOn,
  lastFreezeOn,
}: {
  open: boolean;
  onClose: () => void;
  playStreak: number;
  lastPlayedOn: string | null;
  lastFreezeOn: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const today = localDate(new Date(), browserTimezone());
  const state = {
    play_streak: playStreak,
    last_played_on: lastPlayedOn,
    last_freeze_on: lastFreezeOn,
  };
  const days = streakWeek(state, today);
  const footer = streakMessage(state, today);

  return (
    <BottomSheet open={open} onClose={onClose} label="Streak" scrollable={false}>
      <View className="flex-row items-center justify-end gap-4">
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View className="mt-8 flex-row items-center justify-between px-6">
        <View>
          <Text
            className="font-display text-[60px] leading-[64px]"
            style={{ color: palette.streak }}
          >
            {String(currentStreak(state, today)).padStart(2, "0")}
          </Text>
          <Text className="mt-1 font-display text-lg" style={{ color: palette.streak }}>
            day streak!
          </Text>
        </View>
        <Image source={STREAK_IMAGE} contentFit="contain" style={{ width: 83, height: 96 }} />
      </View>

      <View className="mt-12 items-center">
        <View accessibilityRole="list" className="w-full flex-row items-end justify-between">
          {days.map((day) => (
            <View key={day.date} className="items-center gap-1.5">
              <Text
                className={
                  day.isToday
                    ? "font-sans text-xs font-bold text-foreground"
                    : "font-sans text-xs font-bold text-mutedForeground"
                }
              >
                {day.label}
              </Text>
              <View
                style={{
                  borderWidth: RING_WIDTH,
                  borderColor: !day.isToday
                    ? "transparent"
                    : day.played
                      ? palette.leafDeep
                      : day.frozen
                        ? palette.freezeDeep
                        : palette.streak,
                  borderRadius: radius.md + RING_WIDTH + RING_OFFSET,
                  padding: RING_OFFSET,
                }}
              >
                <View
                  accessibilityLabel={`${day.date}${day.played ? " played" : day.frozen ? " frozen" : " not played"}`}
                  className="h-8 w-8 items-center justify-center"
                  style={{
                    borderRadius: radius.md,
                    backgroundColor: day.played
                      ? palette.leaf
                      : day.frozen
                        ? palette.freeze
                        : palette.surface2,
                  }}
                >
                  {day.played && <TickIcon size={14} color="#ffffff" />}
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text variant="body" className="mt-8 w-full pr-6 text-right leading-relaxed">
          {footer}
        </Text>
      </View>
    </BottomSheet>
  );
}

const RING_WIDTH = 2;
const RING_OFFSET = 2;
