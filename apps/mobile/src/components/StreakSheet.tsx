import { Text } from "@/components/text";
import { browserTimezone } from "@word-lock/core/account";
import { isGracePeriodActive, localDate, streakWeek } from "@word-lock/core/game";
import { CrossIcon, StreakIcon, TickIcon } from "@word-lock/icons/native";
import { colors, radius } from "@word-lock/tokens/native";
import { View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { useTheme } from "@/theme/ThemeProvider";

export function StreakSheet({
  open,
  onClose,
  playStreak,
  lastPlayedOn,
}: {
  open: boolean;
  onClose: () => void;
  playStreak: number;
  lastPlayedOn: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const today = localDate(new Date(), browserTimezone());
  const days = streakWeek({ play_streak: playStreak, last_played_on: lastPlayedOn }, today);
  const playedToday = lastPlayedOn === today;
  const isGrace = isGracePeriodActive(
    { play_streak: playStreak, last_played_on: lastPlayedOn },
    today,
  );

  const footer =
    playStreak === 0
      ? "Play a game today to start your streak."
      : playedToday
        ? "You're on a roll! Come back tomorrow to keep your streak going."
        : isGrace
          ? "Play a game today to keep your streak going, you used a grace!"
          : "Play a game today to keep your streak going.";

  return (
    <BottomSheet open={open} onClose={onClose} label="Streak" scrollable={false}>
      <View className="flex-row items-center justify-end gap-4">
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View className="mt-8 items-center">
        <View style={{ paddingLeft: 36 }}>
          <StreakIcon size={112} />
        </View>

        <Text variant="autoGen26" className="mt-6">
          {playStreak === 1 ? "1 Day Streak!" : `${playStreak} Day Streak!`}
        </Text>

        <View accessibilityRole="list" className="mt-6 w-full flex-row items-end justify-between">
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
                  borderColor: day.isToday ? STREAK_RING_COLOR : "transparent",
                  borderRadius: radius.md + RING_WIDTH + RING_OFFSET,
                  padding: RING_OFFSET,
                }}
              >
                <View
                  accessibilityLabel={`${day.date}${day.played ? " played" : " not played"}`}
                  className="h-8 w-8 items-center justify-center"
                  style={{
                    borderRadius: radius.md,
                    backgroundColor: day.played ? palette.leaf : palette.surface2,
                  }}
                >
                  {day.played && <TickIcon size={14} color="#ffffff" />}
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text variant="body" className="mt-8 leading-relaxed">
          {footer}
        </Text>
      </View>
    </BottomSheet>
  );
}

const RING_WIDTH = 2;
const RING_OFFSET = 2;
const STREAK_RING_COLOR = "#FC9502";
