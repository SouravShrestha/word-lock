import { LiveIcon } from "@/components/icons/LiveIcon";
import type { ReviewFrame } from "@word-lock/core/game";
import { cn } from "@/lib/utils";

export function ReviewBar({
  frame,
  moveCount,
  isPlayerOne,
  onLive,
}: {
  frame: ReviewFrame;
  moveCount: number;
  isPlayerOne: boolean;
  onLive: () => void;
}) {
  const { move, moveNumber } = frame;
  const word = move.passed
    ? "Passed"
    : move.word.charAt(0).toUpperCase() + move.word.slice(1).toLowerCase();

  return (
    <div className="bg-board flex h-12 w-full items-center justify-between gap-3 px-4 py-3 rounded-xs">
      <span className="shrink-0 select-none text-xs font-medium tabular-nums text-muted-foreground">
        {moveNumber} / {moveCount}
      </span>

      <span
        className={cn(
          "min-w-0 truncate font-display text-sm font-medium tracking-widest",
          move.passed ? "text-muted-foreground" : isPlayerOne ? "text-p1" : "text-p2",
        )}
      >
        {word}
      </span>

      <button
        type="button"
        onClick={onLive}
        aria-label="Back to live"
        className="press shrink-0 py-0.5"
      >
        <LiveIcon className="h-8 w-8" />
      </button>
    </div>
  );
}
