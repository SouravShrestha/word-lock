/**
 * Row shapes for the `wl_*` tables.
 *
 * Kept in their own module so that `identity.server.ts` and `service.server.ts`
 * can both use them without importing each other — the identity layer needs the
 * row types, and the service layer needs the identity functions.
 */

/**
 * The subset of a player most code cares about. Plenty of queries select only
 * these three columns, so this stays deliberately narrow.
 *
 * `username` is the only name a player has, and it is nullable: guests never set
 * one, and an account has none until the username sheet is answered.
 */
export interface PlayerRow {
  id: string;
  session_id: string;
  username: string | null;
}

/**
 * A player as loaded alongside a game. Carries `user_id` so a logged-in viewer
 * can be identified by their verified account rather than by a session id taken
 * from the request body.
 */
export interface GamePlayerRow extends PlayerRow {
  user_id: string | null;
}

/**
 * A player row including the account-linked columns. Returned by
 * `resolvePlayer`, which always selects the full set.
 *
 * Every account field is nullable or defaulted because guests have rows too: a
 * guest simply has `user_id` and `username` null, a default star count, and no
 * streak.
 */
export interface PlayerAccountRow extends PlayerRow {
  user_id: string | null;
  /** Ladder currency. The player's league is derived from this, never stored. */
  stars: number;
  /** Highest star count ever reached. Never decreases. */
  peak_stars: number;
  star_games: number;
  play_streak: number;
  best_play_streak: number;
  /** `YYYY-MM-DD` in the player's own timezone, not UTC. */
  last_played_on: string | null;
  /** IANA timezone name reported by the browser. */
  timezone: string | null;
}

export interface GameRow {
  id: string;
  room_code: string;
  grid: string;
  player1_id: string;
  player2_id: string | null;
  current_turn_player_id: string | null;
  status: "waiting" | "active" | "completed";
  winner_id: string | null;
  end_reason: string | null;
  last_move_at: string;
  created_at: string;
  /** Star change applied when the game completed. Null means unranked. */
  p1_star_delta: number | null;
  p2_star_delta: number | null;
}

export interface MoveRow {
  id: string;
  game_id: string;
  player_id: string;
  word: string;
  tile_indices: number[];
  passed: boolean;
  created_at: string;
}
