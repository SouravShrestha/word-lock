import { useEffect, useState } from "react";

import { clockLabelFor, isBankControl } from "@word-lock/core/game";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

/**
 * One player's corner of the bar.
 * Grouped as columns:
 *
 *   [avatar/name] [time/score]      [time/score] [avatar/name]
 */
function PlayerChip({
  player,
  score,
  clock,
  active,
  slot,
  mirrored,
  reaction,
  isBank,
}: {
  player: { name: string; avatar: string } | null;
  score: number;
  clock: string;
  active: boolean;
  slot: 1 | 2;
  mirrored: boolean;
  reaction?: { key: number; emoji: string } | null;
  isBank: boolean;
}) {
  const ring = slot === 1 ? "ring-p1" : "ring-p2";
  const scoreColor = active ? (slot === 1 ? "text-p1" : "text-p2") : "text-muted-foreground";
  const cardColor = active ? (slot === 1 ? "bg-p1/30" : "bg-p2/30") : "bg-card";
  const borderColor = active ? (slot === 1 ? "border-p1/40" : "border-p2/40") : "border-border";
  const timeColor = active ? (slot === 1 ? "text-p1" : "text-p2") : "text-muted-foreground";
  const row = cn("flex items-center gap-2", mirrored && "flex-row-reverse");
  const clockWidth = isBank ? "w-16" : "w-20";

  return (
    <div className={cn(row, "-mx-3 justify-between")}>
      <div className="w-20 flex flex-col items-center gap-1">
        <div className="relative flex justify-center">
          {reaction && (
            <span
              key={reaction.key}
              aria-hidden
              className="animate-in fade-in slide-in-from-bottom-2 zoom-in-50 absolute top-2 z-10 text-4xl duration-200"
            >
              {reaction.emoji}
            </span>
          )}
          <Avatar
            avatar={player?.avatar}
            className={cn(
              "h-12 w-12 shrink-0 ring-offset-card transition-opacity duration-200",
              ring,
              active ? "ring-[3px] ring-offset-2" : "ring-2 ring-offset-2 opacity-60",
            )}
          />
        </div>
        <p
          title={player?.name ?? undefined}
          className={cn(
            "mt-2 text-center text-sm font-semibold leading-none",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {player?.name ?? "-"}
        </p>
      </div>
      <div className={cn("flex flex-col", mirrored ? "items-center gap-1" : "items-center gap-2")}>
        <div
          className={cn(
            clockWidth,
            "flex flex-col items-center rounded-md pb-2 pt-2.5 border-2",
            cardColor,
            borderColor,
          )}
        >
          <p
            className={cn(
              "font-display text-sm font-bold tabular-nums leading-none tracking-tight",
              timeColor,
            )}
          >
            {clock}
          </p>
        </div>
        <p
          className={cn(
            "mt-1.5 font-display text-4xl font-bold leading-none tabular-nums tracking-tight",
            scoreColor,
          )}
        >
          {formatScore(score)}
        </p>
      </div>
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
    isBank: isBankControl(game.timeControl),
  });

  return (
    <div className="neo bg-transparent px-2 py-3">
      <div className="flex items-center justify-between gap-2 px-2">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />
        <PlayerChip {...chipFor(farSlot)} mirrored />
      </div>
    </div>
  );
}
