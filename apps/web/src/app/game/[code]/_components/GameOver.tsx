"use client";

import { GameResultCard } from "@/components/GameResultCard";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { useAccount } from "@word-lock/client";
import { leagueChange, leagueForStars } from "@word-lock/core/account";
import { cn } from "@/lib/utils";

export function GameOver({
  game,
  onExit,
  onRematch,
  rematchPending,
}: {
  game: any;
  onExit: () => void;
  onRematch?: () => void;
  rematchPending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <GameResultCard
        game={game}
        onExit={onExit}
        action={
          onRematch ? { label: "New Game", onClick: onRematch, pending: rematchPending } : null
        }
        note={<LeagueMove game={game} />}
      />
    </div>
  );
}

function LeagueMove({ game }: { game: any }) {
  const { data: account } = useAccount();

  const slot = game.viewerSlot as 1 | 2 | null;
  const delta: number | null = slot ? (game.starDeltas?.[slot] ?? null) : null;
  const after = account?.stars ?? null;

  if (delta === null || after === null) return null;

  const change = leagueChange(after - delta, after);
  if (!change) return null;

  const league = leagueForStars(after);

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider",
        LEAGUE_TEXT_CLASS[league.id],
      )}
    >
      <LeagueIcon league={league.id} className="h-5 w-5" />
      {change === "promotion" ? `Promoted to ${league.name}` : `Dropped to ${league.name}`}
    </span>
  );
}
