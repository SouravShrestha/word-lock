import { useEffect, useState } from "react";

import { timeLeftLabel } from "@word-lock/core/game";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

function TurnClock({ deadline, status }: { deadline: string | null; status: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const timerLabel = status === "active" && deadline ? timeLeftLabel(deadline) : null;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <ClockIcon className="h-4 w-4 text-foreground" />
      <p className="font-display text-xs font-medium tabular-nums tracking-wide leading-none">
        {timerLabel ?? (status === "completed" ? "Game over" : "-")}
      </p>
    </div>
  );
}

function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

function PlayerChip({
  player,
  score,
  active,
  slot,
  mirrored,
  reaction,
}: {
  player: { name: string; avatar: string } | null;
  score: number;
  active: boolean;
  slot: 1 | 2;
  mirrored: boolean;
  reaction?: { key: number; emoji: string } | null;
}) {
  const ring = slot === 1 ? "ring-p1" : "ring-p2";
  const scoreColor = slot === 1 ? "text-p1" : "text-p2";

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", mirrored && "flex-row-reverse")}>
      <div className="relative flex min-w-0 flex-col items-center gap-1.5">
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
        <p
          title={player?.name ?? undefined}
          className={cn(
            "mt-1.5 max-w-full truncate text-center text-xs leading-none",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {player?.name ?? "-"}
        </p>
      </div>
      <p
        className={cn(
          "font-display text-3xl font-bold leading-none tabular-nums mx-4",
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

  const chipFor = (slot: 1 | 2) => ({
    slot,
    player: slot === 1 ? game.players.one : game.players.two,
    score: (scores ?? game.scores)[slot],
    active: slot === 1 ? p1Active : p2Active,
    reaction: reaction?.slot === slot ? reaction : null,
  });

  return (
    <div className="neo px-2 pt-2 pb-2 bg-transparent">
      <div className="flex items-center gap-2">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />
        <TurnClock deadline={game.turnDeadline} status={game.status} />
        <PlayerChip {...chipFor(farSlot)} mirrored />
      </div>
    </div>
  );
}
