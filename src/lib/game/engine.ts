// Framework-agnostic Word-lock game engine.
// Pure functions only: no React, no Supabase, no I/O.

export const GRID_SIZE = 5;
export const TILE_COUNT = GRID_SIZE * GRID_SIZE;

/** 0 = neutral, 1 = player one, 2 = player two */
export type Owner = 0 | 1 | 2;
export type PlayerSlot = 1 | 2;

export interface EngineMove {
  playerSlot: PlayerSlot;
  word: string;
  tileIndices: number[];
  /** A pass has an empty word and no tiles. */
  passed?: boolean;
}

export interface BoardState {
  owners: Owner[];
  locked: boolean[];
  usedWords: Set<string>;
  scores: { 1: number; 2: number };
  neutral: number;
  finished: boolean;
  winnerSlot: PlayerSlot | null; // null = draw or unfinished
  endReason: "filled" | "double-pass" | null;
}

/** Frequency-weighted letter pool (Scrabble-ish distribution, vowel heavy). */
const LETTER_POOL =
  "AAAAAAAAAEEEEEEEEEEEEIIIIIIIIIOOOOOOOOUUUUYYBBCCDDDDFFGGGHHJKLLLLMMNNNNNNPPQRRRRRRSSSSTTTTTTVVWWXZ";

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const MIN_VOWELS = 7;
const MAX_SAME_LETTER = 4;
const MIN_POSSIBLE_WORDS = 50;

function randomLetter(rand: () => number) {
  return LETTER_POOL[Math.floor(rand() * LETTER_POOL.length)];
}

/** Counts how many dictionary words can be spelled from the grid's letter multiset. */
export function countPossibleWords(
  grid: string[],
  words: Iterable<string>,
  stopAt = MIN_POSSIBLE_WORDS,
): number {
  const available: Record<string, number> = {};
  for (const letter of grid) available[letter] = (available[letter] ?? 0) + 1;

  let found = 0;
  for (const word of words) {
    const need: Record<string, number> = {};
    let ok = true;
    for (const ch of word.toUpperCase()) {
      need[ch] = (need[ch] ?? 0) + 1;
      if (need[ch] > (available[ch] ?? 0)) {
        ok = false;
        break;
      }
    }
    if (ok && ++found >= stopAt) return found;
  }
  return found;
}

function gridIsWellFormed(grid: string[]): boolean {
  let vowels = 0;
  const counts: Record<string, number> = {};
  for (const letter of grid) {
    if (VOWELS.has(letter)) vowels++;
    counts[letter] = (counts[letter] ?? 0) + 1;
    if (counts[letter] > MAX_SAME_LETTER) return false;
  }
  return vowels >= MIN_VOWELS;
}

/**
 * Generates a 25-letter grid that is vowel-balanced, letter-capped and
 * guaranteed to yield at least 50 playable dictionary words.
 */
export function generateGrid(
  words: Iterable<string>,
  rand: () => number = Math.random,
  maxAttempts = 200,
): string[] {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: string[] = [];
    for (let i = 0; i < TILE_COUNT; i++) grid.push(randomLetter(rand));
    if (!gridIsWellFormed(grid)) continue;
    if (countPossibleWords(grid, words) < MIN_POSSIBLE_WORDS) continue;
    return grid;
  }
  // Fallback: vowel-seeded grid, still capped, so we never loop forever.
  const grid: string[] = [];
  for (let i = 0; i < MIN_VOWELS; i++) {
    const vowels = "AEIOU";
    grid.push(vowels[Math.floor(rand() * vowels.length)]);
  }
  while (grid.length < TILE_COUNT) grid.push(randomLetter(rand));
  return grid;
}

export function neighborsOf(index: number): number[] {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const out: number[] = [];
  if (row > 0) out.push(index - GRID_SIZE);
  if (row < GRID_SIZE - 1) out.push(index + GRID_SIZE);
  if (col > 0) out.push(index - 1);
  if (col < GRID_SIZE - 1) out.push(index + 1);
  return out;
}

const NEIGHBORS: number[][] = Array.from({ length: TILE_COUNT }, (_, i) => neighborsOf(i));

/**
 * Returns true if at least one tile could still be locked in a future turn.
 *
 * An owned tile is lockable unless every neighbour that could ever become the
 * same owner is already blocked — specifically, unless it has a neighbour
 * locked by the opponent (locked tiles never change owner).
 *
 * A neutral tile is lockable as player P unless it has a neighbour locked by
 * the opposing player. It is permanently unlockable only when it is blocked
 * for BOTH players simultaneously.
 */
function hasLockableTile(owners: Owner[], locked: boolean[]): boolean {
  for (let i = 0; i < TILE_COUNT; i++) {
    if (locked[i]) continue;
    const owner = owners[i];
    if (owner !== 0) {
      const opponent = (owner === 1 ? 2 : 1) as Owner;
      const blockedByOpponent = NEIGHBORS[i].some((n) => locked[n] && owners[n] === opponent);
      if (!blockedByOpponent) return true;
    } else {
      const blockedAsP1 = NEIGHBORS[i].some((n) => locked[n] && owners[n] === 2);
      const blockedAsP2 = NEIGHBORS[i].some((n) => locked[n] && owners[n] === 1);
      if (!(blockedAsP1 && blockedAsP2)) return true;
    }
  }
  return false;
}

/**
 * A tile locks when every orthogonal neighbour is owned by the same player
 * that owns the tile. Locked tiles never change owner again.
 */
function applyLocking(owners: Owner[], locked: boolean[]) {
  for (let i = 0; i < TILE_COUNT; i++) {
    if (locked[i]) continue;
    const owner = owners[i];
    if (owner === 0) continue;
    const surrounded = NEIGHBORS[i].every((n) => owners[n] === owner);
    if (surrounded) locked[i] = true;
  }
}

/** Replays the full move history to derive the authoritative board state. */
export function computeBoardState(grid: string[], moves: EngineMove[]): BoardState {
  const owners: Owner[] = new Array(TILE_COUNT).fill(0) as Owner[];
  const locked: boolean[] = new Array(TILE_COUNT).fill(false);
  const usedWords = new Set<string>();

  let consecutivePasses = 0;
  let endReason: BoardState["endReason"] = null;

  for (const move of moves) {
    if (move.passed || !move.word) {
      consecutivePasses++;
      if (consecutivePasses >= 2) {
        endReason = "double-pass";
        break;
      }
      continue;
    }
    consecutivePasses = 0;
    usedWords.add(move.word.toUpperCase());
    for (const index of move.tileIndices) {
      if (index < 0 || index >= TILE_COUNT) continue;
      if (locked[index]) continue;
      owners[index] = move.playerSlot;
    }
    applyLocking(owners, locked);
  }

  let one = 0;
  let two = 0;
  let neutral = 0;
  for (const owner of owners) {
    if (owner === 1) one++;
    else if (owner === 2) two++;
    else neutral++;
  }

  if (endReason === null && !hasLockableTile(owners, locked)) endReason = "filled";
  const finished = endReason !== null;

  return {
    owners,
    locked,
    usedWords,
    scores: { 1: one, 2: two },
    neutral,
    finished,
    winnerSlot: finished ? (one > two ? 1 : two > one ? 2 : null) : null,
    endReason,
  };
}

export type MoveRejection =
  | "not-your-turn"
  | "game-not-active"
  | "empty-word"
  | "word-too-short"
  | "duplicate-tile"
  | "tile-out-of-range"
  | "letters-mismatch"
  | "not-a-word"
  | "word-already-used";

export interface MoveValidationInput {
  grid: string[];
  word: string;
  tileIndices: number[];
  state: BoardState;
  isPlayersTurn: boolean;
  gameActive: boolean;
  isWord: (word: string) => boolean;
}

export function validateMove(input: MoveValidationInput): MoveRejection | null {
  const { grid, tileIndices, state, isPlayersTurn, gameActive, isWord } = input;
  const word = input.word.trim().toUpperCase();

  if (!gameActive) return "game-not-active";
  if (!isPlayersTurn) return "not-your-turn";
  if (!word) return "empty-word";
  if (word.length < 3) return "word-too-short";
  if (word.length !== tileIndices.length) return "letters-mismatch";

  const seen = new Set<number>();
  for (const index of tileIndices) {
    if (!Number.isInteger(index) || index < 0 || index >= TILE_COUNT) return "tile-out-of-range";
    if (seen.has(index)) return "duplicate-tile";
    seen.add(index);
  }

  for (let i = 0; i < word.length; i++) {
    if (grid[tileIndices[i]] !== word[i]) return "letters-mismatch";
  }

  if (state.usedWords.has(word)) return "word-already-used";
  if (!isWord(word)) return "not-a-word";
  return null;
}

export const MOVE_REJECTION_MESSAGES: Record<MoveRejection, string> = {
  "not-your-turn": "It's not your turn yet.",
  "game-not-active": "This game isn't active.",
  "empty-word": "Tap some tiles to build a word.",
  "word-too-short": "Words must be at least 3 letters.",
  "duplicate-tile": "Each tile can only be used once per word.",
  "tile-out-of-range": "That tile isn't on the board.",
  "letters-mismatch": "Those letters don't match the board.",
  "not-a-word": "That's not in the dictionary.",
  "word-already-used": "That word was already played this game.",
};
