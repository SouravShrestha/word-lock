import { Text } from "@/components/text";
import { useAccount } from "@word-lock/client";
import { browserTimezone, leagueById } from "@word-lock/core/account";
import { currentStreak, localDate } from "@word-lock/core/game";
import { LEAGUE_TEXT_COLOR, LeagueIcon, StreakIcon } from "@word-lock/icons/native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { StreakSheet } from "@/components/StreakSheet";

const STREAK_TEXT_COLOR = "#FC9502";

export function StreakPill() {
  const { data } = useAccount();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const stored = data?.playStreak ?? 0;
  const lastPlayedOn = data?.lastPlayedOn ?? null;
  const lastFreezeOn = data?.lastFreezeOn ?? null;
  const today = localDate(new Date(), browserTimezone());
  const value = currentStreak(
    { play_streak: stored, last_played_on: lastPlayedOn, last_freeze_on: lastFreezeOn },
    today,
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value === 1 ? "1 day streak" : `${value} day streak`}
        onPress={() => setOpen(true)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        hitSlop={8}
        className="flex-row items-center gap-1"
        style={{ opacity: pressed ? 0.7 : 1 }}
      >
        <StreakIcon size={24} />
        <Text variant="autoGen24" className="mt-0.5" style={{ color: STREAK_TEXT_COLOR }}>
          {value}
        </Text>
      </Pressable>

      <StreakSheet
        open={open}
        onClose={() => setOpen(false)}
        playStreak={stored}
        lastPlayedOn={lastPlayedOn}
        lastFreezeOn={lastFreezeOn}
      />
    </>
  );
}

export function StarsPill() {
  const { data } = useAccount();
  const value = data?.stars ?? 0;
  const league = data?.league ?? "bronze";

  return (
    <View
      accessibilityLabel={`${value} stars, ${leagueById(league).name} league`}
      className="flex-row items-center gap-1"
    >
      <LeagueIcon league={league} size={36} />
      <Text variant="autoGen25" className="ml-1" style={{ color: LEAGUE_TEXT_COLOR[league] }}>
        {value}
      </Text>
    </View>
  );
}
