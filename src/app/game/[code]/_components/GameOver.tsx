"use client";

import { GameResultCard } from "@/components/GameResultCard";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { useAccount } from "@/hooks/use-account";
import { leagueChange, leagueForStars } from "@/lib/account/leagues";
import { cn } from "@/lib/utils";

/**
 * The end-of-game screen.
 *
 * A full-bleed overlay over the board, not a dialog: the game is finished, so
 * there is nothing underneath left to interact with, and the same scoreboard /
 * words / grid the player was just reading stays in place — only now with the
 * result written across the middle of it.
 *
 * The card itself is shared with match history (`GameResultCard`); this file only
 * supplies the two things that are specific to having *just* finished — the
 * league movement callout and the pair of buttons.
 */
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

/**
 * A promotion or demotion caused by this game.
 *
 * The star delta itself is on the card, which can read it straight off the game
 * payload. The *league* change cannot be: only the total is stored, so the band
 * before this game has to be worked back as `current - delta`. That makes this
 * the one part of the result that depends on live account state, which is why it
 * lives here rather than in the shared card — a history sheet opened weeks later
 * would compute it against today's star count and be wrong.
 *
 * Renders nothing in the common case where the game did not cross a boundary.
 */
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
