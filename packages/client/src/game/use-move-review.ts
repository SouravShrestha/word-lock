"use client";

import { useCallback, useMemo, useState } from "react";

import { frameAt, type HistoryMove, type ReviewFrame } from "@word-lock/core/game";

export interface MoveReview {
  frame: ReviewFrame | null;
  isReviewing: boolean;
  moveCount: number;
  canStepBack: boolean;
  canStepForward: boolean;
  stepBack: () => void;
  stepForward: () => void;
  goLive: () => void;
}

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
