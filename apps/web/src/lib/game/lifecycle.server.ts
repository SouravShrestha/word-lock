import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { PublicError } from "@/lib/http/errors";
import { resolvePlayer, type Caller } from "./identity.server";
import { computeStarOutcome, UNRANKED_OUTCOME } from "./stars.server";
import { getDictionary } from "./dictionary.server";
import { loadGame } from "./read.server";
import { generateGrid, type PlayerAccountRow } from "@word-lock/core/game";

export const MAX_ACTIVE_GAMES = 5;

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRoomCode(length = 5) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return out;
}

async function countActiveGames(playerId: string) {
  const { count } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id", { count: "exact", head: true })
    .neq("status", "completed")
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);
  return count ?? 0;
}

/**
 * Taking a seat needs a signed-in, named account. The login wall is UI-only,
 * so without this a direct request (or a client whose effects ran behind the
 * wall) seats a guest row with no username — rendered as `UNNAMED_PLAYER` to
 * the opponent for the rest of the game.
 */
function requireNamedAccount(player: PlayerAccountRow): void {
  if (!player.user_id) throw new PublicError("Sign in to play.", 401);
  if (!player.username) throw new PublicError("Pick a username before playing.", 403);
}

export async function createGame(caller: Caller) {
  const player = await resolvePlayer(caller);
  requireNamedAccount(player);
  if ((await countActiveGames(player.id)) >= MAX_ACTIVE_GAMES) {
    throw new PublicError(
      `You already have ${MAX_ACTIVE_GAMES} games on the go. Finish one before starting another.`,
    );
  }

  const grid = generateGrid(getDictionary()).join("");

  for (let attempt = 0; attempt < 6; attempt++) {
    const roomCode = makeRoomCode();
    const { data, error } = await getSupabaseAdmin()
      .from("wl_games")
      .insert({
        room_code: roomCode,
        grid,
        player1_id: player.id,
        current_turn_player_id: player.id,
        status: "waiting",
      })
      .select("room_code")
      .maybeSingle();
    if (data) return { roomCode: data.room_code };
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }
  throw new PublicError("Couldn't allocate a room code. Try again.");
}

export async function joinGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  requireNamedAccount(player);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new PublicError("No game found with that code.");
  const { game } = loaded;

  if (game.player1_id === player.id || game.player2_id === player.id) {
    return { roomCode: game.room_code };
  }
  if (game.player2_id) throw new PublicError("That game is already full.");
  if (game.status === "completed") throw new PublicError("That game is already finished.");
  if ((await countActiveGames(player.id)) >= MAX_ACTIVE_GAMES) {
    throw new PublicError(
      `You already have ${MAX_ACTIVE_GAMES} games on the go. Finish one before joining another.`,
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("wl_games")
    .update({ player2_id: player.id })
    .eq("id", game.id)
    .is("player2_id", null);
  if (error) throw new Error(error.message);

  return { roomCode: game.room_code };
}

export async function startGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id, player2_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) throw new PublicError("Game not found.");
  if (game.player1_id !== player.id) throw new PublicError("Only the host can start the game.");
  if (game.status !== "waiting") throw new PublicError("Game is not in the waiting state.");
  if (!game.player2_id) throw new PublicError("Waiting for an opponent to join.");

  const { error } = await getSupabaseAdmin()
    .from("wl_games")
    .update({
      status: "active",
      current_turn_player_id: game.player1_id,
      last_move_at: new Date().toISOString(),
    })
    .eq("id", game.id);
  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function destroyGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) return { ok: true };

  if (game.status === "waiting" && game.player1_id === player.id) {
    await getSupabaseAdmin().from("wl_games").delete().eq("id", game.id);
  }
  return { ok: true };
}

export async function forfeitGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id, player2_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) throw new PublicError("Game not found.");
  if (game.status !== "active") throw new PublicError("This game isn't active.");

  const isPlayer1 = game.player1_id === player.id;
  const isPlayer2 = game.player2_id === player.id;
  if (!isPlayer1 && !isPlayer2) throw new PublicError("You are not a participant in this game.");

  const winnerId = isPlayer1 ? game.player2_id : game.player1_id;

  const loaded = await loadGame(roomCode);
  const { outcome, commit } = loaded
    ? await computeStarOutcome(loaded.game, winnerId)
    : { outcome: UNRANKED_OUTCOME, commit: async () => {} };

  const { data: completed } = await getSupabaseAdmin()
    .from("wl_games")
    .update({
      status: "completed",
      winner_id: winnerId,
      end_reason: "forfeit",
      last_move_at: new Date().toISOString(),
      p1_star_delta: outcome.p1Delta,
      p2_star_delta: outcome.p2Delta,
      p1_stars_after: outcome.p1StarsAfter,
      p2_stars_after: outcome.p2StarsAfter,
    })
    .eq("id", game.id)
    .neq("status", "completed")
    .select("id")
    .maybeSingle();

  if (completed) await commit();

  return { ok: true };
}

export async function leaveLobby(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id, player2_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) return { ok: true };
  if (game.status !== "waiting") return { ok: true };
  if (game.player2_id !== player.id) return { ok: true };

  await getSupabaseAdmin().from("wl_games").update({ player2_id: null }).eq("id", game.id);

  return { ok: true };
}

export async function deleteAccount(caller: Caller): Promise<{ ok: true }> {
  if (!caller.userId) {
    throw new PublicError("Log in to delete your account.");
  }

  const player = await resolvePlayer(caller);

  const { data: unfinished } = await getSupabaseAdmin()
    .from("wl_games")
    .select("room_code, status, player1_id")
    .neq("status", "completed")
    .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`);

  for (const game of unfinished ?? []) {
    if (game.status === "waiting") {
      if (game.player1_id === player.id) await destroyGame(caller, game.room_code);
      else await leaveLobby(caller, game.room_code);
    } else {
      await forfeitGame(caller, game.room_code);
    }
  }

  const { error } = await getSupabaseAdmin().rpc("wl_delete_account", {
    p_user_id: caller.userId,
  });
  if (error) throw new Error(error.message);

  // Deleting the auth user last: doing it first would mean a slow or retried
  // request resolves a caller that no longer verifies, mid-cleanup.
  const { error: authError } = await getSupabaseAdmin().auth.admin.deleteUser(caller.userId);
  if (authError) throw new Error(authError.message);

  return { ok: true };
}
