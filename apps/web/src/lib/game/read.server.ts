import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { UNNAMED_PLAYER } from "@word-lock/core/account";
import {
  computeBoardState,
  type EngineMove,
  type PlayerSlot,
  type GamePlayerRow,
  type GameRow,
  type MoveRow,
  type PlayerRow,
} from "@word-lock/core/game";

export const TURN_LIMIT_MS = 24 * 60 * 60 * 1000;

export type {
  PlayerRow,
  PlayerAccountRow,
  GamePlayerRow,
  GameRow,
  MoveRow,
} from "@word-lock/core/game";

export { findViewerId } from "@word-lock/core/game";

export function toEngineMoves(game: GameRow, moves: MoveRow[]): EngineMove[] {
  return moves.map((m) => ({
    playerSlot: (m.player_id === game.player1_id ? 1 : 2) as PlayerSlot,
    word: m.word,
    tileIndices: m.tile_indices ?? [],
    passed: m.passed,
  }));
}

export async function loadGame(roomCode: string) {
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();
  if (!game) return null;

  const [{ data: moves }, { data: players }] = await Promise.all([
    getSupabaseAdmin()
      .from("wl_moves")
      .select("*")
      .eq("game_id", game.id)
      .order("created_at", { ascending: true }),
    getSupabaseAdmin()
      .from("wl_players")
      .select("id, session_id, username, avatar, user_id")
      .in("id", [game.player1_id, game.player2_id].filter(Boolean) as string[]),
  ]);

  return {
    game: game as GameRow,
    moves: (moves ?? []) as MoveRow[],
    players: (players ?? []) as GamePlayerRow[],
  };
}

export function serializeGame(
  game: GameRow,
  moves: MoveRow[],
  players: PlayerRow[],
  viewerId: string | null,
) {
  const state = computeBoardState(game.grid.split(""), toEngineMoves(game, moves));
  const p1 = players.find((p) => p.id === game.player1_id) ?? null;
  const p2 = players.find((p) => p.id === game.player2_id) ?? null;

  return {
    id: game.id,
    roomCode: game.room_code,
    grid: game.grid.split(""),
    status: game.status,
    endReason: game.end_reason,
    winnerId: game.winner_id,
    lastMoveAt: game.last_move_at,
    currentTurnPlayerId: game.current_turn_player_id,
    turnDeadline: new Date(new Date(game.last_move_at).getTime() + TURN_LIMIT_MS).toISOString(),
    players: {
      one: p1 ? { id: p1.id, name: p1.username ?? UNNAMED_PLAYER, avatar: p1.avatar } : null,
      two: p2 ? { id: p2.id, name: p2.username ?? UNNAMED_PLAYER, avatar: p2.avatar } : null,
    },
    viewerSlot: viewerId
      ? viewerId === game.player1_id
        ? 1
        : viewerId === game.player2_id
          ? 2
          : null
      : null,
    starDeltas: {
      1: game.p1_star_delta,
      2: game.p2_star_delta,
    },
    owners: state.owners,
    locked: state.locked,
    scores: state.scores,
    neutral: state.neutral,
    playedWords: moves
      .filter((m) => !m.passed)
      .map((m) => ({ word: m.word, playerId: m.player_id })),
    history: moves.map((m) => ({
      id: m.id,
      word: m.word,
      passed: m.passed,
      playerId: m.player_id,
      tileIndices: m.tile_indices ?? [],
      createdAt: m.created_at,
    })),
  };
}

export type SerializedGame = ReturnType<typeof serializeGame>;
