/**
 * Account-level reads and writes: the public username, and the profile summary
 * the UI needs to decide whether to prompt for one.
 *
 * Server-only. Game state does not belong here — that stays in
 * `lib/game/service.server.ts`.
 */
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { PublicError } from "@/lib/http/errors";
import { resolvePlayer, type Caller } from "@/lib/game/identity.server";
import {
  USERNAME_ERROR_COPY,
  normalizeUsername,
  validateUsername,
  isAvatarId,
  normalizeAvatarId,
  leagueForStars,
  type LeagueId,
} from "@word-lock/core/account";

/** Postgres unique-violation. Raised by the unique index on `lower(username)`. */
const UNIQUE_VIOLATION = "23505";

const ALREADY_SET_MESSAGE = "Your username is already set and can't be changed.";
const TAKEN_MESSAGE = "That username is taken. Try another.";

export interface AccountSummary {
  playerId: string;
  /** The player's only name. Null until they have claimed one. */
  username: string | null;
  /** True once a username exists, since it cannot be changed afterwards. */
  usernameLocked: boolean;
  /** Chosen avatar id, e.g. `avatar_01`. Always set — the column is defaulted. */
  avatar: string;
  /**
   * ISO timestamp of when this player row was created, for the "Joined" line on
   * the profile. Signing in adopts an existing guest row, so this is the date
   * they first turned up rather than the date they made an account.
   */
  joinedAt: string;
  stars: number;
  /** Highest star count ever reached. Never decreases. */
  peakStars: number;
  starGames: number;
  /**
   * Derived from `stars` rather than stored, and sent anyway so every surface
   * reads the same band the server does instead of each recomputing it.
   */
  league: LeagueId;
  playStreak: number;
  bestPlayStreak: number;
  /**
   * `YYYY-MM-DD` in the player's own timezone, or null if they never played.
   * Exposed so the client can place the streak on a calendar week — the count
   * alone says nothing about which days it covers.
   */
  lastPlayedOn: string | null;
}

/** Everything the profile and the username prompt need, in one round trip. */
export async function getAccountSummary(caller: Caller): Promise<AccountSummary> {
  const player = await resolvePlayer(caller);
  return {
    playerId: player.id,
    username: player.username,
    usernameLocked: player.username !== null,
    avatar: normalizeAvatarId(player.avatar),
    joinedAt: player.created_at,
    stars: player.stars,
    peakStars: player.peak_stars,
    starGames: player.star_games,
    league: leagueForStars(player.stars).id,
    playStreak: player.play_streak,
    bestPlayStreak: player.best_play_streak,
    lastPlayedOn: player.last_played_on,
  };
}

/**
 * Reports whether a username could be claimed right now.
 *
 * Advisory only. Between this check and the write, someone else can take the
 * name, so `setUsername` still has to handle the unique violation — this exists
 * so the player finds out while typing rather than on submit.
 */
export async function checkUsernameAvailable(
  raw: string,
): Promise<{ available: boolean; reason?: string }> {
  const normalized = normalizeUsername(raw);

  const invalid = validateUsername(normalized);
  if (invalid) return { available: false, reason: USERNAME_ERROR_COPY[invalid] };

  // Stored values are always normalised, so exact equality matches the same
  // rows as the unique index on lower(username).
  const { data } = await getSupabaseAdmin()
    .from("wl_players")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  if (data) return { available: false, reason: TAKEN_MESSAGE };
  return { available: true };
}

/**
 * Claims a username for the caller's account. Permanent: a username can be set
 * exactly once.
 *
 * This is the player's name everywhere — score bar, lobby, match history and
 * leaderboard all read it — so it is the only naming write in the app.
 *
 * The once-only rule is enforced by the `.is("username", null)` filter on the
 * update rather than by reading first and then writing. A read-then-write would
 * let two concurrent requests both see null and the second would overwrite the
 * first.
 */
export async function setUsername(caller: Caller, raw: string): Promise<{ username: string }> {
  if (!caller.userId) {
    throw new PublicError("Log in to pick a username.");
  }

  const normalized = normalizeUsername(raw);
  const invalid = validateUsername(normalized);
  if (invalid) throw new PublicError(USERNAME_ERROR_COPY[invalid]);

  const player = await resolvePlayer(caller);
  if (player.username) throw new PublicError(ALREADY_SET_MESSAGE);

  const { data, error } = await getSupabaseAdmin()
    .from("wl_players")
    .update({ username: normalized })
    .eq("id", player.id)
    .is("username", null)
    .select("username")
    .maybeSingle();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new PublicError(TAKEN_MESSAGE);
    throw new Error(error.message);
  }

  // No row came back: the filter excluded it, meaning a username was set
  // between resolving the player and this write.
  if (!data?.username) throw new PublicError(ALREADY_SET_MESSAGE);

  return { username: data.username };
}

/**
 * Changes the caller's avatar.
 *
 * Unlike the username this is freely changeable — it is a picture, not an
 * identity, so nothing downstream depends on it being stable and there is no
 * once-only filter to enforce. A plain update is the whole write.
 *
 * The id is validated against the set this build knows about rather than trusted
 * from the body: the column's CHECK only guarantees the shape, so `avatar_99`
 * would otherwise be storable and would render as a broken image for everyone
 * who saw this player.
 *
 * Logged-in callers only. A guest row is replaced the moment its browser forgets
 * the session id, so letting one dress up would be a setting with nowhere to live.
 */
export async function setAvatar(caller: Caller, avatar: string): Promise<{ avatar: string }> {
  if (!caller.userId) {
    throw new PublicError("Log in to change your avatar.");
  }

  if (!isAvatarId(avatar)) {
    throw new PublicError("That avatar doesn't exist.");
  }

  const player = await resolvePlayer(caller);

  const { data, error } = await getSupabaseAdmin()
    .from("wl_players")
    .update({ avatar })
    .eq("id", player.id)
    .select("avatar")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new PublicError("Couldn't save your avatar. Try again.");

  return { avatar: data.avatar };
}
