import { LiveIcon } from "@/components/icons/LiveIcon";
import type { ReviewFrame } from "@/lib/game/review";
import { cn } from "@/lib/utils";

/**
 * What the player is looking at while stepping through the history.
 *
 * It takes the word preview's seat and its exact height, because the grid below
 * is capped by whatever is left of the viewport — a review panel added as an
 * extra row would resize the board the player is reading. The preview has
 * nothing to say during a review anyway: no selection can be built on a board
 * that has already been played past.
 *
 * The word is in the colour of whoever played it, the same signal the played
 * words strip uses, so the seat is read without a name taking up the width.
 * The live badge is the way back and is the only control here — the steppers in the
 * bottom bar are where the walking happens, and duplicating them would put two
 * next buttons on screen at once.
 */
export function ReviewBar({
  frame,
  moveCount,
  isPlayerOne,
  onLive,
}: {
  frame: ReviewFrame;
  moveCount: number;
  /** Whether the move being reviewed was played from seat one. */
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
