/**
 * Viewer resolution for the read-only game fetch path.
 *
 * Pure and dependency-free so it can be unit tested without pulling in the
 * dictionary or a Supabase client.
 */

export interface ViewerCandidate {
  id: string;
  session_id: string;
  user_id?: string | null;
}

export interface ViewerCaller {
  sessionId?: string;
  /** Verified account id, or null for a guest. */
  userId: string | null;
}

/**
 * Works out which of a game's players the caller is.
 *
 * A logged-in caller is matched on their verified `user_id`; only a guest falls
 * back to the session id from the request body. That ordering matters: after a
 * guest row is merged into an account the old session id no longer appears on
 * any row, and matching it first would report a participant as a spectator.
 *
 * Returns null for a genuine spectator, which is a supported state — the fetch
 * endpoint serves anyone opening a room code, including people not in the game.
 * Unlike `resolvePlayer` this never creates a row: viewing a game should not
 * bring a player into existence.
 */
export function findViewerId(players: ViewerCandidate[], caller: ViewerCaller): string | null {
  if (caller.userId) {
    return players.find((p) => p.user_id === caller.userId)?.id ?? null;
  }
  if (!caller.sessionId) return null;
  return players.find((p) => p.session_id === caller.sessionId)?.id ?? null;
}
