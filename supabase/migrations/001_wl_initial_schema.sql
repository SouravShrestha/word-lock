CREATE TABLE public.wl_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.wl_game_status AS ENUM ('waiting', 'active', 'completed');

CREATE TABLE public.wl_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  grid TEXT NOT NULL,
  player1_id UUID NOT NULL REFERENCES public.wl_players(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.wl_players(id) ON DELETE SET NULL,
  current_turn_player_id UUID REFERENCES public.wl_players(id) ON DELETE SET NULL,
  status public.wl_game_status NOT NULL DEFAULT 'waiting',
  winner_id UUID REFERENCES public.wl_players(id) ON DELETE SET NULL,
  end_reason TEXT,
  last_move_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wl_games_player1_idx ON public.wl_games(player1_id);
CREATE INDEX wl_games_player2_idx ON public.wl_games(player2_id);

CREATE TABLE public.wl_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.wl_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.wl_players(id) ON DELETE CASCADE,
  word TEXT NOT NULL DEFAULT '',
  tile_indices INTEGER[] NOT NULL DEFAULT '{}',
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wl_moves_game_idx ON public.wl_moves(game_id, created_at);

-- Only service_role can write; no public access (all ops go through API routes)
GRANT ALL ON public.wl_players TO service_role;
GRANT ALL ON public.wl_games TO service_role;
GRANT ALL ON public.wl_moves TO service_role;

ALTER TABLE public.wl_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wl_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wl_moves ENABLE ROW LEVEL SECURITY;
