import { z } from "zod";

import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { getVerifiedUser } from "@/integrations/supabase/client.route";
import type { PlayerAccountRow } from "@word-lock/core/game";

const PLAYER_COLUMNS =
  "id, session_id, created_at, user_id, username, avatar, stars, peak_stars, star_games, play_streak, best_play_streak, last_played_on, timezone";

export interface Caller {
  sessionId: string;
  userId: string | null;
  timezone?: string;
}

export interface CallerInput {
  sessionId: string;
  timezone?: string;
}

export const callerSchema = z.object({
  sessionId: z.string().uuid(),
  timezone: z.string().max(64).optional(),
});

export const roomCodeSchema = z.string().min(3).max(12);

export async function resolveCaller(request: Request, input: CallerInput): Promise<Caller> {
  const user = await getVerifiedUser(request);
  return {
    sessionId: input.sessionId,
    userId: user?.id ?? null,
    timezone: input.timezone,
  };
}

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

async function syncTimezone(player: PlayerAccountRow, caller: Caller): Promise<PlayerAccountRow> {
  if (!caller.timezone || caller.timezone === player.timezone) return player;

  const patch = { timezone: caller.timezone };
  await getSupabaseAdmin().from("wl_players").update(patch).eq("id", player.id);
  return { ...player, ...patch };
}

export async function claimGuestHistory(userId: string, sessionId: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin().rpc("wl_claim_player", {
    p_user_id: userId,
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
