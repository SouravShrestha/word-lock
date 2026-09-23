import { useAccount, useLeaderboard } from "@word-lock/client";
import { leagueById } from "@word-lock/core/account";
import {
  LeagueIcon,
  LEAGUE_TEXT_COLOR,
  RankIcon,
  StarIcon,
  StreakIcon,
} from "@word-lock/icons/native";
import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export function OverviewCard() {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const { data: account } = useAccount();
  const { data: leaderboard } = useLeaderboard();

  const me = leaderboard?.me ?? null;
  const stars = account?.stars ?? 0;
  const league = account?.league ?? "bronze";
  const streak = account?.playStreak ?? 0;

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
        label={`${stars} stars`}
      />
      <Fact
        icon={<LeagueIcon league={league} size={28} />}
        tint={palette.foreground}
        label={leagueById(league).name}
      />
      <Fact
        icon={<RankIcon size={20} color={palette.foreground} />}
        tint={palette.foreground}
        label={me ? `#${me.leagueRank} in league` : "Unranked"}
      />
    </View>
  );
}

function Fact({ icon, tint, label }: { icon: ReactNode; tint: string; label: string }) {
  return (
    <View className="w-[47%] flex-row items-center gap-2.5">
      <View className="w-8 shrink-0 items-center justify-center h-7">{icon}</View>
      <Text
        className="min-w-0 flex-1 text-[15px] font-semibold tracking-wide"
        style={{ color: tint }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
