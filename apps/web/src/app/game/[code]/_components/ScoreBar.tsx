import { useEffect, useState } from "react";

import { clockLabelFor } from "@word-lock/core/game";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

/**
 * One player's corner of the bar, a 2×2 grid:
 *
 *   [avatar] [clock]        [clock] [avatar]
 *   [name]   [score]        [score] [name]
 *
 * The far player's chip is the mirror image, so each clock sits beside its own
 * avatar and the two scores face each other across the middle.
 */
function PlayerChip({
  player,
  score,
  clock,
  active,
  slot,
  mirrored,
  reaction,
}: {
  player: { name: string; avatar: string } | null;
  score: number;
  clock: string;
  active: boolean;
  slot: 1 | 2;
  mirrored: boolean;
  reaction?: { key: number; emoji: string } | null;
}) {
  const ring = slot === 1 ? "ring-p1" : "ring-p2";
  const scoreColor = slot === 1 ? "text-p1" : "text-p2";
  const identityCol = mirrored ? "col-start-2" : "col-start-1";
  const numbersCol = mirrored ? "col-start-1" : "col-start-2";

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[auto_auto] grid-rows-[auto_auto] items-center gap-x-3 gap-y-1.5",
      )}
    >
      <div className={cn("relative row-start-1 flex justify-center", identityCol)}>
        {reaction && (
          <span
            key={reaction.key}
            aria-hidden
            className="animate-in fade-in slide-in-from-bottom-2 zoom-in-50 absolute top-0 z-10 text-2xl duration-200"
          >
            {reaction.emoji}
          </span>
        )}
        <Avatar
          avatar={player?.avatar}
          className={cn(
            "h-8 w-8 shrink-0 ring-offset-card transition-opacity duration-200",
            ring,
            active ? "ring-[3px] ring-offset-2" : "ring-2 ring-offset-2 opacity-60",
          )}
        />
      </div>
      <p
        className={cn(
          "row-start-1 flex items-center gap-1 font-display tv-caption font-medium tabular-nums leading-none tracking-wide",
          numbersCol,
          mirrored ? "justify-start" : "justify-end",
          active ? scoreColor : "text-muted-foreground",
        )}
      >
        <ClockIcon className="h-3.5 w-3.5 shrink-0" />
        {clock}
      </p>
      <p
        title={player?.name ?? undefined}
        className={cn(
          "row-start-2 max-w-24 truncate text-center tv-caption leading-none",
          identityCol,
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {player?.name ?? "-"}
      </p>
      <p
        className={cn(
          "row-start-2 font-display text-2xl font-bold leading-none tabular-nums",
          numbersCol,
          mirrored ? "text-left" : "text-right",
          active ? scoreColor : "text-muted-foreground",
        )}
      >
        {formatScore(score)}
      </p>
    </div>
  );
}

export function ScoreBar({
  game,
  p1Active,
  p2Active,
  reaction,
  scores,
}: {
  game: any;
  p1Active: boolean;
  p2Active: boolean;
  reaction?: { key: number; emoji: string; slot: 1 | 2 } | null;
  scores?: { 1: number; 2: number };
}) {
  const nearSlot: 1 | 2 = game.viewerSlot === 2 ? 2 : 1;
  const farSlot: 1 | 2 = nearSlot === 1 ? 2 : 1;

  // One ticker for both clocks, only while a turn is actually running.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (game.status !== "active") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [game.status]);

  const chipFor = (slot: 1 | 2) => ({
    slot,
    clock: clockLabelFor(game, slot, slot === 1 ? p1Active : p2Active, now),
    player: slot === 1 ? game.players.one : game.players.two,
    score: (scores ?? game.scores)[slot],
    active: slot === 1 ? p1Active : p2Active,
    reaction: reaction?.slot === slot ? reaction : null,
  });

  return (
    <div className="neo px-2 pt-2 pb-2 bg-transparent">
      <div className="flex items-center justify-between gap-6 px-2">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />
        <PlayerChip {...chipFor(farSlot)} mirrored />
      </div>
    </div>
  );
}
