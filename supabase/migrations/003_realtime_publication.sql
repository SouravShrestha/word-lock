-- Add wl_games and wl_moves to the Supabase Realtime publication so that
-- postgres_changes events are broadcast to connected clients.
-- Also set REPLICA IDENTITY FULL so that row-level filters work correctly
-- for UPDATE events (Supabase Realtime requires this for filtered subscriptions).
ALTER TABLE public.wl_games REPLICA IDENTITY FULL;
ALTER TABLE public.wl_moves REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.wl_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wl_moves;
