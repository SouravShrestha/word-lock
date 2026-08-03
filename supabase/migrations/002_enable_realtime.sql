-- Enable SELECT access for anonymous users so realtime works
CREATE POLICY "Enable read access for all users" ON public.wl_games FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.wl_moves FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.wl_players FOR SELECT USING (true);
