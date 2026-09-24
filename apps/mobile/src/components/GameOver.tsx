import { Modal, Text, View } from "react-native";
import { useAccount } from "@word-lock/client";
import { leagueChange, leagueForStars } from "@word-lock/core/account";
import { LeagueIcon, LEAGUE_TEXT_COLOR } from "@word-lock/icons/native";

import { GameResultCard, type ResultGame } from "@/components/GameResultCard";

export function GameOver({
  game,
  onExit,
  onRematch,
  rematchPending,
}: {
  game: ResultGame;
  onExit: () => void;
  onRematch?: () => void;
  rematchPending?: boolean;
}) {
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-background/80 px-4">
        <View className="w-full max-w-sm">
          <GameResultCard
            game={game}
            onExit={onExit}
            action={
              onRematch ? { label: "New Game", onPress: onRematch, pending: rematchPending } : null
            }
            note={<LeagueMove game={game} />}
          />
        </View>
      </View>
    </Modal>
  );
}

function LeagueMove({ game }: { game: ResultGame }) {
  const { data: account } = useAccount();

  const slot = game.viewerSlot;
  const delta: number | null = slot ? (game.starDeltas?.[slot] ?? null) : null;
  const after = account?.stars ?? null;

  if (delta === null || after === null) return null;

  const change = leagueChange(after - delta, after);
  if (!change) return null;

  const league = leagueForStars(after);

  return (
    <View className="flex-row items-center gap-1.5">
      <LeagueIcon league={league.id} size={20} />
      <Text
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: LEAGUE_TEXT_COLOR[league.id] }}
      >
        {change === "promotion" ? `Promoted to ${league.name}` : `Dropped to ${league.name}`}
      </Text>
    </View>
  );
}
