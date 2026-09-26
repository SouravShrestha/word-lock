import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { claimTurn, finishOrAdvance } from "./moves.server";
import { TURN_LIMIT_MS, type GameRow, type MoveRow } from "./read.server";

const SWEEP_BATCH_LIMIT = 50;
const SWEEP_CONCURRENCY = 5;

async function sweepOneGame(game: GameRow): Promise<boolean> {
  if (!game.current_turn_player_id) return false;

  try {
    await claimTurn(game, game.current_turn_player_id);
  } catch {
    return false;
  }

  const { data: moves } = await getSupabaseAdmin()
    .from("wl_moves")
    .select("*")
    .eq("game_id", game.id)
    .order("created_at", { ascending: true });
  const { data: inserted } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({
      game_id: game.id,
      player_id: game.current_turn_player_id,
      word: "",
      tile_indices: [],
      passed: true,
    })
    .select("*")
    .single();
  if (!inserted) return false;

  await finishOrAdvance(game, [...((moves ?? []) as MoveRow[]), inserted as MoveRow]);
  return true;
}

export async function sweepExpiredTurns() {
  const cutoff = new Date(Date.now() - TURN_LIMIT_MS).toISOString();
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("status", "active")
    .lt("last_move_at", cutoff)
    .limit(SWEEP_BATCH_LIMIT);

  const rows = (games ?? []) as GameRow[];
  let swept = 0;

  for (let i = 0; i < rows.length; i += SWEEP_CONCURRENCY) {
    const batch = rows.slice(i, i + SWEEP_CONCURRENCY);
    const results = await Promise.all(batch.map(sweepOneGame));
    swept += results.filter(Boolean).length;
  }

  return { swept };
}
