import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { CLOCK_GRACE_MS } from "@word-lock/core/game";
import { expireTurn } from "./moves.server";
import { type GameRow, type MoveRow } from "./read.server";

const SWEEP_BATCH_LIMIT = 50;
const SWEEP_CONCURRENCY = 5;

async function sweepOneGame(game: GameRow): Promise<boolean> {
  const { data: moves } = await getSupabaseAdmin()
    .from("wl_moves")
    .select("*")
    .eq("game_id", game.id)
    .order("created_at", { ascending: true });

  return expireTurn(game, (moves ?? []) as MoveRow[]);
}

export async function sweepExpiredTurns() {
  const cutoff = new Date(Date.now() - CLOCK_GRACE_MS).toISOString();
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("status", "active")
    .lt("turn_deadline", cutoff)
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
