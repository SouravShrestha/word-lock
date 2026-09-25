import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { getVerifiedUser, queueCookie } from "@/integrations/supabase/client.route";
import { parseCookieHeader } from "@/integrations/supabase/cookies";
import { PublicError } from "@/lib/http/errors";
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

/**
 * A same-origin form/fetch POST always carries an `Origin` header in modern
 * browsers, matching or not; a same-origin navigation, a non-browser client
 * (the mobile app), or an older browser may omit it entirely, so absence is
 * allowed through rather than rejected. This is defense-in-depth alongside the
 * incidental protection `application/json` bodies already give against
 * classic form-based CSRF, not a replacement for it.
 */
function verifySameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let expected: string;
  try {
    expected = configured ? new URL(configured).origin : new URL(request.url).origin;
  } catch {
    return;
  }

  if (origin !== expected) {
    throw new PublicError("Cross-origin request rejected.", 403);
  }
}

const GUEST_COOKIE_NAME = "wl_guest_bind";

function guestBindSecret(): string | null {
  return process.env.GUEST_COOKIE_SECRET || null;
}

function guestBindValue(sessionId: string, secret: string): string {
  return createHmac("sha256", secret).update(sessionId).digest("hex");
}

function readGuestBindCookie(request: Request): string | null {
  return (
    parseCookieHeader(request.headers.get("cookie")).find((c) => c.name === GUEST_COOKIE_NAME)
      ?.value ?? null
  );
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Binds a guest session id to an httpOnly cookie so knowing the id alone
 * (leaked via a shared device, a log line, or copy-pasted between browsers)
 * isn't enough to act as that guest from a browser that already has a
 * *different* guest identity bound. It cannot fully close guest impersonation:
 * the mobile app has no cookie jar for its guest calls, and a brand-new
 * browser with no prior cookie at all is indistinguishable from a first-ever
 * visit, so it is only checked against a session id that already has a row —
 * a fresh id (e.g. right after sign-out starts a new guest session) is just
 * bound, never rejected, so it can't false-positive on a stale cookie from an
 * earlier identity in the same browser. Fails open (feature disabled) unless
 * `GUEST_COOKIE_SECRET` is configured.
 */
async function enforceGuestBinding(request: Request, sessionId: string): Promise<void> {
  // `api/game/fetch` resolves spectators with an empty sessionId (no session of
  // their own yet) — nothing to bind, and binding "" would clobber a real
  // guest cookie already set on this browser for an unrelated tab/game.
  if (!sessionId) return;

  const secret = guestBindSecret();
  if (!secret) return;

  const cookieValue = readGuestBindCookie(request);
  const expected = guestBindValue(sessionId, secret);

  if (cookieValue && !timingSafeStringEqual(cookieValue, expected)) {
    const { data: existing } = await getSupabaseAdmin()
      .from("wl_players")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      throw new PublicError("This session doesn't belong to this browser.", 401);
    }
  }

  queueCookie(request, {
    name: GUEST_COOKIE_NAME,
    value: expected,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    },
  });
}

export async function resolveCaller(request: Request, input: CallerInput): Promise<Caller> {
  verifySameOrigin(request);

  const user = await getVerifiedUser(request);
  const userId = user?.id ?? null;

  if (!userId) {
    await enforceGuestBinding(request, input.sessionId);
  }

  return {
    sessionId: input.sessionId,
    userId,
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
