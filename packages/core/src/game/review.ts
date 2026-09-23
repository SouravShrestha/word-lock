import { computeBoardState, type BoardState, type EngineMove, type PlayerSlot } from "./engine";

export interface HistoryMove {
  id: string;
  word: string;
  passed: boolean;
  playerId: string;
  tileIndices: number[];
  createdAt: string;
}

export interface ReviewFrame {
  moveNumber: number;
  move: HistoryMove;
  state: BoardState;
  claimed: number[];
}

export function toEngineMoves(moves: HistoryMove[], playerOneId: string | null): EngineMove[] {
  return moves.map((m) => ({
    playerSlot: (m.playerId === playerOneId ? 1 : 2) as PlayerSlot,
    word: m.word,
    tileIndices: m.tileIndices ?? [],
    passed: m.passed,
  }));
}

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
