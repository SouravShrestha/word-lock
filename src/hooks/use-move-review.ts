"use client";

import { useCallback, useMemo, useState } from "react";

import { frameAt, type HistoryMove, type ReviewFrame } from "@/lib/game/review";

export interface MoveReview {
  /** The turn being reviewed, or null when the live board is showing. */
  frame: ReviewFrame | null;
  isReviewing: boolean;
  moveCount: number;
  canStepBack: boolean;
  canStepForward: boolean;
  stepBack: () => void;
  stepForward: () => void;
  goLive: () => void;
}

/**
 * Walks the board back through the move history.
 *
 * The cursor is the 1-based move number being reviewed, and null means live.
 * It is a move *number* rather than an offset from the end so that a move
 * landing while the player is reading stays out of the way: the frame they are
 * looking at keeps its identity instead of sliding back a turn under them.
 *
 * Stepping back from live lands on the last move rather than the one before it.
 * The board is identical either way, but the frame names the move and lights up
 * the tiles it took, so the first tap already says something — where skipping to
 * the second-to-last move would silently discard the most recent turn, the one
 * the player is most likely reaching for.
 *
 * Stepping forward past the last move returns to live, so the way out is the
 * direction the player was already going.
 */
export function useMoveReview({
  grid,
  moves,
  playerOneId,
}: {
  grid: string[];
  moves: HistoryMove[];
  playerOneId: string | null;
}): MoveReview {
  const [cursor, setCursor] = useState<number | null>(null);
  const moveCount = moves.length;

  /*
   * A cursor can outlive the history it pointed into — a game reset, or a review
   * left open across a refetch — so the frame is the source of truth for whether
   * a review is showing, not the cursor. An out-of-range cursor resolves to null
   * and the live board comes back on its own.
   */
  const frame = useMemo(
    () => (cursor === null ? null : frameAt(grid, moves, playerOneId, cursor)),
    [cursor, grid, moves, playerOneId],
  );

  const stepBack = useCallback(() => {
    setCursor((current) => {
      if (moveCount === 0) return null;
      if (current === null || current > moveCount) return moveCount;
      return Math.max(1, current - 1);
    });
  }, [moveCount]);

  const stepForward = useCallback(() => {
    setCursor((current) => {
      if (current === null) return null;
      return current >= moveCount ? null : current + 1;
    });
  }, [moveCount]);

  const goLive = useCallback(() => setCursor(null), []);

  return {
    frame,
    isReviewing: frame !== null,
    moveCount,
    canStepBack: moveCount > 0 && (frame === null || frame.moveNumber > 1),
    canStepForward: frame !== null,
    stepBack,
    stepForward,
    goLive,
  };
}
