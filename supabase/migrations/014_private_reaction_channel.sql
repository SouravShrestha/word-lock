-- Moves emoji reactions onto a private Realtime channel.
--
-- Reactions used to ride the public `game-<id>` channel alongside the
-- `postgres_changes` subscriptions. A public channel has no authorization, so
-- any client holding the anon key (it ships in every bundle) and a game's id
-- could join it and broadcast a forged `{ emoji, slot }` — arbitrary text, in
-- either player's name — onto both players' screens. The server path was
-- already sound (`/api/game/reaction` validates the emoji and derives the slot);
-- the channel was the gap.
--
-- Reactions now go out on `reactions-<id>`, joined with `private: true`, and
-- Realtime authorizes a private join against `realtime.messages` RLS. This
-- policy lets only the game's two players receive. There is deliberately no
-- INSERT policy: no client may send on it at all. The server sends with the
-- service-role client, which bypasses RLS.
--
-- `postgres_changes` stay on the public `game-<id>` channel, whose rows are
-- already scoped by migration 013's policies. Keeping them apart means a
-- refused private join — a spectator, or a joiner not yet seated — can never
-- take game updates down with it.

DROP POLICY IF EXISTS "Players can receive reactions in their own games" ON realtime.messages;

CREATE POLICY "Players can receive reactions in their own games" ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension = 'broadcast'
    AND EXISTS (
      SELECT 1 FROM public.wl_games g
      WHERE realtime.topic() = 'reactions-' || g.id::text
        AND (
          g.player1_id IN (SELECT public.wl_caller_player_ids())
          OR g.player2_id IN (SELECT public.wl_caller_player_ids())
        )
    )
  );
