// Move-history review: the board as it stood at an earlier turn.
//
// Pure and client-safe, like `engine.ts` — it is a thin layer over
// `computeBoardState`, which already derives the whole board by replaying moves.
// Reviewing a past turn is therefore the same operation as deriving the present
// one, run over a prefix of the history, so a reviewed board can never disagree
// with the live board about how the rules work.
import { computeBoardState, type BoardState, type EngineMove, type PlayerSlot } from "./engine";

/** One move as it arrives on the client, from `serializeGame`'s `history`. */
export interface HistoryMove {
  id: string;
  word: string;
  passed: boolean;
  playerId: string;
  /** The tiles the word spelled, in order. Empty on a pass. */
  tileIndices: number[];
  createdAt: string;
}

/** A single turn, rendered: the board just after it, and what it claimed. */
export interface ReviewFrame {
  /** 1-based position in the history, which is what the player is shown. */
  moveNumber: number;
  move: HistoryMove;
  state: BoardState;
  /** The tiles this move played, highlighted on the grid. Empty on a pass. */
  claimed: number[];
}

/**
 * Turns serialized history into engine moves.
 *
 * The seat is worked out from player one's id rather than carried on the move,
 * for the same reason `serializeGame` does it: the slot is a property of the
 * game's seating, not of the row.
 */
export function toEngineMoves(moves: HistoryMove[], playerOneId: string | null): EngineMove[] {
  return moves.map((m) => ({
    playerSlot: (m.playerId === playerOneId ? 1 : 2) as PlayerSlot,
    word: m.word,
    tileIndices: m.tileIndices ?? [],
    passed: m.passed,
  }));
}

/**
 * The board immediately after move `moveNumber` (1-based).
 *
 * Returns null for a number outside the history, so a stale cursor — a review
 * still open when the game is refetched — degrades to "show the live board"
 * rather than throwing.
 */
export function frameAt(
  grid: string[],
  moves: HistoryMove[],
  playerOneId: string | null,
  moveNumber: number,
): ReviewFrame | null {
  if (!Number.isInteger(moveNumber) || moveNumber < 1 || moveNumber > moves.length) return null;

  const state = computeBoardState(grid, toEngineMoves(moves, playerOneId).slice(0, moveNumber));
  const move = moves[moveNumber - 1];

  return {
    moveNumber,
    move,
    state,
    claimed: move.passed ? [] : (move.tileIndices ?? []),
  };
}
