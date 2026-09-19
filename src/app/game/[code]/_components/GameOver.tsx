"use client";

import { CelebrateIcon } from "@/components/icons/CelebrateIcon";
import { MainMenuIcon } from "@/components/icons/MainMenuIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { Tile, type TileOwner } from "@/components/Tile";
import { useAccount } from "@/hooks/use-account";
import { leagueChange, leagueForStars } from "@/lib/account/leagues";
import { cn } from "@/lib/utils";
import { PlayedWords } from "./PlayedWords";

export function GameOver({ game, onNew }: { game: any; onNew: () => void }) {
  const p1 = game.players.one;
  const p2 = game.players.two;

  const winner = game.winnerId === p1?.id ? p1 : game.winnerId === p2?.id ? p2 : null;

  const isDraw = !winner;

  let reasonLabel: string;
  if (game.endReason === "forfeit") {
    reasonLabel = "Opponent left the game";
  } else if (game.endReason === "double-pass") {
    reasonLabel = "Both players passed";
  } else {
    reasonLabel = "Board filled";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm px-4">
      <div className="neo bg-card w-full max-w-sm p-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-1 mb-4">
          <CelebrateIcon className="w-8 h-8" />
          <h2 className="text-xl font-bold font-display text-center">
            {isDraw ? "It's a draw!" : `${winner!.name} wins!`}
          </h2>
          <span className="text-sm text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {reasonLabel}
          </span>
        </div>

        {/* Score breakdown */}
        <div className="flex items-center justify-between gap-0 mb-4 w-full">
          {/* P1 */}
          <div
            className={`flex-1 flex flex-col items-center justify-center rounded-sm px-3 py-2.5 gap-1 max-w-1/3 ${
              game.winnerId === p1?.id ? "bg-p1-soft ring-2 ring-p1" : "bg-muted/40"
            }`}
          >
            <p className="text-xs font-semibold text-p1 truncate max-w-full text-center leading-none">
              {p1?.name ?? "Player 1"}
            </p>
            <p className="text-3xl font-bold font-display leading-none">{game.scores[1]}</p>
            {game.winnerId === p1?.id && (
              <span className="text-[10px] font-bold text-p1 uppercase tracking-wider">winner</span>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center text-lg font-bold text-muted-foreground max-w-1/3">
            vs
          </div>

          {/* P2 */}
          <div
            className={`max-w-1/3 flex-1 flex flex-col items-center justify-center rounded-sm px-3 py-2.5 gap-1 ${
              game.winnerId === p2?.id ? "bg-p2-soft ring-2 ring-p2" : "bg-muted/40"
            } `}
          >
            <p className="text-xs font-semibold text-p2 truncate max-w-full text-center leading-none">
              {p2?.name ?? "Player 2"}
            </p>
            <p className="text-3xl font-bold font-display leading-none">{game.scores[2]}</p>
            {game.winnerId === p2?.id && (
              <span className="text-[10px] font-bold text-p2 uppercase tracking-wider">winner</span>
            )}
          </div>
        </div>

        {/* Star movement */}
        <StarResult game={game} />

        {/* Word history */}
        <div className="mb-3 w-full">
          <PlayedWords game={game} />
        </div>

        {/* Board snapshot */}
        <div className="mb-4 w-full">
          <div className="grid grid-cols-5 gap-0.5 w-full">
            {game.grid.map((letter: string, index: number) => (
              <Tile
                key={index}
                letter={letter}
                owner={game.owners[index] as TileOwner}
                locked={game.locked[index]}
                disabled
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNew}
          className="chunky-btn btn-primary w-full py-2 font-semibold flex items-center justify-center gap-2"
        >
          <MainMenuIcon className="w-4 h-4" color="currentColor" />
          Back to lobby
        </button>
      </div>
    </div>
  );
}

/**
 * The viewer's star change from this game, with a callout when it crossed a
 * league boundary.
 *
 * Renders nothing at all when the game was unranked. The server records a null
 * delta in that case — one side was a guest — and "0 stars" would read as a
 * result rather than as the absence of one.
 *
 * The delta comes from the game payload, which is authoritative and immutable
 * once the game is complete. The *league* change has to be worked back from the
 * account's current star count, since only the total is stored: after minus the
 * delta is where the player stood before. `GameClient` refreshes the account
 * summary on completion so that total is the post-game one.
 */
function StarResult({ game }: { game: any }) {
  const { data: account } = useAccount();

  const slot = game.viewerSlot as 1 | 2 | null;
  const delta: number | null = slot ? (game.starDeltas?.[slot] ?? null) : null;

  if (delta === null) return null;

  const after = account?.stars ?? null;
  const league = after !== null ? leagueForStars(after) : null;
  const change = after !== null ? leagueChange(after - delta, after) : null;

  const gained = delta > 0;

  return (
    <div className="mb-4 flex flex-col items-center gap-1.5">
      <span className={cn("stat-pill text-base", gained ? "text-mint" : "text-muted-foreground")}>
        <StarIcon className="h-5 w-5" />
        <span className="font-display font-bold tabular-nums">
          {gained ? "+" : ""}
          {delta}
        </span>
      </span>

      {change && league && (
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider",
            LEAGUE_TEXT_CLASS[league.id],
          )}
        >
          <LeagueIcon league={league.id} className="h-5 w-5" />
          {change === "promotion" ? `Promoted to ${league.name}` : `Dropped to ${league.name}`}
        </span>
      )}
    </div>
  );
}
