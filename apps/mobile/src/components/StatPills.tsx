import { useAccount } from "@word-lock/client";
import { leagueById } from "@word-lock/core/account";
import { LEAGUE_TEXT_COLOR, LeagueIcon, StreakIcon } from "@word-lock/icons/native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { StreakSheet } from "@/components/StreakSheet";

const STREAK_TEXT_COLOR = "#FC9502";

export function StreakPill() {
  const { data } = useAccount();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const value = data?.playStreak ?? 0;

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
        <Text
          className="font-display text-base font-bold mt-0.5"
          style={{ color: STREAK_TEXT_COLOR }}
        >
          {value}
        </Text>
      </Pressable>

      <StreakSheet
        open={open}
        onClose={() => setOpen(false)}
        playStreak={value}
        lastPlayedOn={data?.lastPlayedOn ?? null}
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
      <Text
        className="font-display ml-1 text-base font-bold tracking-wide"
        style={{ color: LEAGUE_TEXT_COLOR[league] }}
      >
        {value}
      </Text>
    </View>
  );
}
