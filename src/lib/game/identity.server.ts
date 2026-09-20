/**
 * The single place player identity is resolved.
 *
 * Before accounts existed, every route handler took a `sessionId` straight out
 * of the request body and trusted it — which meant anyone who learned another
 * player's session id could act as them. Now:
 *
 *  - A logged-in caller is identified by the **verified** auth user from their
 *    session cookie. The body's `sessionId` is ignored for identity and used
 *    only as a hint about which guest row to absorb.
 *  - A guest caller still falls back to the body's `sessionId`, which is the
 *    same trust level as before. There is no secret to verify for an anonymous
 *    device, so this is inherent to letting people play without an account.
 *
 * Server-only.
 */
import { z } from "zod";

import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { getVerifiedUser } from "@/integrations/supabase/client.route";
import type { PlayerAccountRow } from "./rows";

/** Columns every caller of `resolvePlayer` needs. */
const PLAYER_COLUMNS =
  "id, session_id, created_at, user_id, username, avatar, stars, peak_stars, star_games, play_streak, best_play_streak, last_played_on, timezone";

/**
 * Who is making this request. Built once per request by `resolveCaller` and
 * passed down into the service layer, replacing the bare `sessionId` string.
 */
export interface Caller {
  /** Guest session id from the request body. Never trusted as identity on its own. */
  sessionId: string;
  /** Verified auth user id, or null for a guest. */
  userId: string | null;
  /** IANA timezone reported by the browser, used for local-day streak boundaries. */
  timezone?: string;
}

export interface CallerInput {
  sessionId: string;
  timezone?: string;
}

/**
 * The identity fields every game endpoint accepts, for route handlers to extend.
 *
 * No name travels with a game action. A player's name is their `username`, which
 * is claimed once through `/api/account/username` and read from the row from
 * then on — so there is nothing here a client could use to rename anyone.
 */
export const callerSchema = z.object({
  sessionId: z.string().uuid(),
  // IANA names are well under this; the cap just bounds the input.
  timezone: z.string().max(64).optional(),
});

/** Room codes are generated as 5 characters, with headroom for older games. */
export const roomCodeSchema = z.string().min(3).max(12);

/**
 * Resolves the caller for a request. The auth lookup verifies the JWT against
 * the auth server, so a forged or expired cookie resolves as a guest rather
 * than as someone else.
 */
export async function resolveCaller(request: Request, input: CallerInput): Promise<Caller> {
  const user = await getVerifiedUser(request);
  return {
    sessionId: input.sessionId,
    userId: user?.id ?? null,
    timezone: input.timezone,
  };
}

/**
 * Returns the `wl_players` row for a caller, creating or claiming one if needed.
 *
 * For a logged-in caller the fast path is a single lookup by `user_id`. The
 * claim function only runs when the account has no player row yet, so the merge
 * logic is not paid for on every move.
 */
export async function resolvePlayer(caller: Caller): Promise<PlayerAccountRow> {
  if (caller.userId) return resolveAccountPlayer(caller);
  return resolveGuestPlayer(caller);
}

async function resolveAccountPlayer(caller: Caller): Promise<PlayerAccountRow> {
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("wl_players")
    .select(PLAYER_COLUMNS)
    .eq("user_id", caller.userId!)
    .maybeSingle();

  if (existing) return syncTimezone(existing as PlayerAccountRow, caller);

  /*
   * No row for this account yet. wl_claim_player either adopts the caller's
   * guest row (carrying their existing games over) or creates a fresh one, in a
   * single transaction.
   */
  const { data: claimedId, error } = await admin.rpc("wl_claim_player", {
    p_user_id: caller.userId!,
    p_session_id: caller.sessionId,
  });
  if (error) throw new Error(error.message);

  const { data: claimed, error: readError } = await admin
    .from("wl_players")
    .select(PLAYER_COLUMNS)
    .eq("id", claimedId as string)
    .single();
  if (readError) throw new Error(readError.message);

  return syncTimezone(claimed as PlayerAccountRow, caller);
}

async function resolveGuestPlayer(caller: Caller): Promise<PlayerAccountRow> {
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("wl_players")
    .select(PLAYER_COLUMNS)
    .eq("session_id", caller.sessionId)
    .maybeSingle();

  if (existing) return syncTimezone(existing as PlayerAccountRow, caller);

  /*
   * A guest row carries no name. Only an account can claim a username, and
   * login is required to play, so a guest row is a transient thing that exists
   * to be adopted by `wl_claim_player` at sign-in.
   */
  const { data, error } = await admin
    .from("wl_players")
    .insert({
      session_id: caller.sessionId,
      timezone: caller.timezone ?? null,
    })
    .select(PLAYER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  return data as PlayerAccountRow;
}

/**
 * Keeps the stored timezone in step with what the browser reports.
 *
 * The timezone matters for streaks: it decides where the local day boundary
 * falls, and players travel. It is the only profile field a game action can
 * change — the name is claimed through its own endpoint and never travels in a
 * move payload.
 */
async function syncTimezone(player: PlayerAccountRow, caller: Caller): Promise<PlayerAccountRow> {
  if (!caller.timezone || caller.timezone === player.timezone) return player;

  const patch = { timezone: caller.timezone };
  await getSupabaseAdmin().from("wl_players").update(patch).eq("id", player.id);
  return { ...player, ...patch };
}

/**
 * Explicitly links the caller's account to their guest row, merging history when
 * the account already has a row of its own. Called right after sign-in.
 *
 * Kept separate from `resolvePlayer` because the merge case only arises at
 * login: an account that already has a player row would otherwise never look at
 * the guest row sitting in this browser's localStorage.
 */
export async function claimGuestHistory(userId: string, sessionId: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin().rpc("wl_claim_player", {
    p_user_id: userId,
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
