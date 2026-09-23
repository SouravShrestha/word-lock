export interface PlayerRow {
  id: string;
  session_id: string;
  username: string | null;
  avatar: string;
}

export interface GamePlayerRow extends PlayerRow {
  user_id: string | null;
}

export interface PlayerAccountRow extends PlayerRow {
  created_at: string;
  user_id: string | null;
  stars: number;
  peak_stars: number;
  star_games: number;
  play_streak: number;
  best_play_streak: number;
  last_played_on: string | null;
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
  p1_star_delta: number | null;
  p2_star_delta: number | null;
  p1_stars_after: number | null;
  p2_stars_after: number | null;
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
