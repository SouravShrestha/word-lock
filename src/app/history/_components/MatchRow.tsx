import type { ComponentType } from "react";

import { DrawFaceIcon } from "@/components/icons/DrawFaceIcon";
import { LossFaceIcon } from "@/components/icons/LossFaceIcon";
import { WinFaceIcon } from "@/components/icons/WinFaceIcon";
import type { GameResult, RecentGameEntry } from "@/lib/game/stats";
import { cn } from "@/lib/utils";
import { MatchAvatar } from "./MatchAvatar";

/**
 * One finished game.
 *
 * The row is a single wide press target rather than a card: the list is the
 * screen's whole content, so boxing every entry would draw a hundred edges
 * around information that is already in rows. It mirrors the leaderboard's
 * flat, full-bleed row instead.
 *
 * Two meta readouts sit under the name — what the game did to your stars, and
 * how it ended — each with its own glyph so the line can be skimmed without
 * reading it.
 */
export function MatchRow({
  entry,
  onSelect,
}: {
  entry: RecentGameEntry;
  onSelect: (entry: RecentGameEntry) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="press flex w-full items-center gap-3.5 px-5 py-3.5 text-left mt-1.5"
    >
      <MatchAvatar seed={entry.opponentId ?? entry.opponentName} />

      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-base font-medium">
          {entry.opponentName}
        </span>

        <span className="mt-1 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <StarMeta delta={entry.starDelta} />
          <ResultMeta
            result={entry.result}
            yourScore={entry.yourScore}
            opponentScore={entry.opponentScore}
          />
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="font-semibold tracking-wide text-sm text-sky">Details</span>
      </span>
    </button>
  );
}

/**
 * Star movement. An unranked game recorded no delta, so it says so rather than
 * printing a zero that would read as "you held your ground".
 */
function StarMeta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="inline-flex items-center gap-1">Unranked</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums text-muted-foreground")}>
      {delta > 0 ? `+ ${delta}` : `- ${Math.abs(delta)}`} stars
    </span>
  );
}

const RESULT_MARK = {
  win: { Icon: WinFaceIcon, label: "Win" },
  loss: { Icon: LossFaceIcon, label: "Loss" },
  draw: { Icon: DrawFaceIcon, label: "Draw" },
} satisfies Record<
  GameResult,
  { Icon: ComponentType<{ className?: string }>; label: string; className?: string }
>;

function ResultMeta({
  result,
  yourScore,
  opponentScore,
}: {
  result: GameResult;
  yourScore: number;
  opponentScore: number;
}) {
  const { Icon, label } = RESULT_MARK[result];

  return (
    <span className={cn("inline-flex items-center gap-1 text-muted-foreground")}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
