import { Text } from "@/components/text";
import { useAccount } from "@word-lock/client";
import { browserTimezone } from "@word-lock/core/account";
import { currentStreak, localDate } from "@word-lock/core/game";
import { StarIcon, StreakIcon } from "@word-lock/icons/native";
import { View } from "react-native";
import type { ReactNode } from "react";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export function OverviewCard() {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const { data: account } = useAccount();
  const stars = account?.stars ?? 0;
  const streak = currentStreak(
    {
      play_streak: account?.playStreak ?? 0,
      last_played_on: account?.lastPlayedOn ?? null,
      last_freeze_on: account?.lastFreezeOn ?? null,
    },
    localDate(new Date(), browserTimezone()),
  );

  return (
    <View className="flex-row flex-wrap gap-x-3 gap-y-5 px-4 pb-4 pt-5">
      <Fact
        icon={
          <View className="ml-2">
            <StreakIcon size={22} />
          </View>
        }
        tint={palette.foreground}
        label={`${String(streak).padStart(2, "0")} days`}
      />
      <Fact
        icon={<StarIcon size={24} color={palette.mint} />}
        tint={palette.foreground}
        label={`${stars} ${stars === 1 ? "medal" : "medals"}`}
      />
    </View>
  );
}

function Fact({ icon, tint, label }: { icon: ReactNode; tint: string; label: string }) {
  return (
    <View className="w-[47%] flex-row items-center gap-2.5">
      <View className="w-8 shrink-0 items-center justify-center h-7">{icon}</View>
      <Text
        variant="label"
        className="min-w-0 flex-1 tracking-wide"
        style={{ color: tint }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
