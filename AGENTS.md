# Word Lock — Agent Notes

Word Lock is a real-time 2-player word territory game built on **Next.js 15 App Router**, deployed to **Cloudflare Workers** via OpenNext.

## Key Architecture Decisions

- **Server-authoritative game logic**: All state mutations go through `src/app/api/game/*/route.ts` route handlers. Clients never mutate game state directly — they call these endpoints and receive updates via Supabase Realtime.
- **Identity has one seam**: `resolveCaller(request, body)` in `src/lib/game/identity.server.ts` builds a `Caller`, and `resolvePlayer(caller)` turns it into a `wl_players` row. A logged-in caller is identified by their **verified** `user_id` and the body's `sessionId` is ignored; only a guest falls back to it. Never resolve a player from a raw session id anywhere else.
- **Login is mandatory (client-side)**: an account is required to play. `useAuth().isLoginRequired` is derived (`ready && !user`), and `AuthSheet` renders as a non-dismissable wall whenever it is true — there is no guest mode and no "open the login sheet" call anywhere. The wall is mounted once as `AuthGate`, which is also the **only** place that asks whether a screen needs an account: on a route listed in `src/lib/auth/public-routes.ts` (`/legal/*`, `/how-to-play`) neither sheet is rendered at all, because a privacy policy nobody can read without signing up is useless to the person deciding whether to sign up — and ad networks crawl that URL logged out. Do not add a second such check anywhere; add the path to that list. Note the **API routes still accept a guest `sessionId`**; the gate is UI-only so far. `wl_claim_player` (migration 005) still merges a pre-existing guest row into an account on first login.
- **Server-only modules**: Files suffixed `.server.ts` (e.g. `src/lib/game/service.server.ts`, `src/lib/game/dictionary.server.ts`, `src/integrations/supabase/client.server.ts`) must **never** be imported in client components. They contain server-side secrets and node-only APIs.
- **Game engine**: Core tile-claiming, locking, and scoring logic lives in `src/lib/game/engine.ts`. This is shared between server route handlers.
- **Client API layer**: `src/lib/game/api.client.ts` is the only place client components should call API routes. Do not `fetch` game endpoints inline in components.
- **Realtime**: `src/integrations/supabase/client.ts` sets up the Supabase browser client used for Realtime subscriptions inside `GameClient.tsx`.
- **Session identity**: `src/hooks/use-session.ts` holds only the session ID in `localStorage`. It is not an identity — a logged-in caller is identified server-side by their verified `user_id`, and the session ID exists so a row can be created before sign-in and adopted by `wl_claim_player` after. It carries no name, and is reset on sign-out.
- **Auth**: Supabase Auth with Google OAuth and magic links, cookie-based via `@supabase/ssr`. `src/middleware.ts` refreshes the session cookie, `src/app/auth/callback/route.ts` completes every sign-in, and `src/hooks/use-auth.ts` is the only place client components read auth state. `src/integrations/supabase/client.route.ts` provides the request-scoped auth client for route handlers.
- **One name per player**: `username` is it — the name opponents see on the score bar, in the lobby and in match history, and the name the leaderboard ranks. Unique (case-insensitively), and settable **once**. Rules live in `src/lib/account/names.ts`. There used to be a separate editable `display_name`; migration 006 dropped it. A name never travels in a request payload: `callerSchema` carries only `sessionId` and `timezone`, and the only naming write in the app is `/api/account/username`. `serializeGame` maps `username` → `players.one/two.name`, falling back to `UNNAMED_PLAYER` since the column is nullable.
- **Picking a username is mandatory too**: `UsernameSheet` blocks any logged-in account whose `username` is null, so login and naming are one two-step gate. Its only exit is backwards: a back arrow (plus a "Wrong account?" link) calls `signOut()`, which flips `isLoginRequired` and hands the screen to `AuthSheet`. Nothing navigates and nothing is destroyed — the account keeps its stars and games, so logging back in returns to the same sheet. A cross would be the wrong glyph here: there is no state to dismiss to.
- **Avatars are stored ids, not URLs**: `wl_players.avatar` (migration 009) holds `avatar_01`-style ids, `NOT NULL DEFAULT 'avatar_01'`, with a CHECK on the _shape_ only — the set grows, and `isAvatarId` in `src/lib/account/avatars.ts` is what decides which ids exist. That pure, client-safe module is the only place the bucket name, the `.png` and the Supabase host are composed into a URL (`avatarUrl`), so moving the files is never a data migration. `src/components/Avatar.tsx` is the single renderer — plain `<img>`, not `next/image`, since the deploy target is Cloudflare Workers and these are small PNGs on a public bucket. Avatars replaced the hash-derived panda/monkey icons: a face is now read from the row rather than invented per surface, which is why the same player looks the same in the lobby, on their profile and in someone else's match history. Freely changeable (`setAvatar`), unlike the username — it is a picture, not an identity.
- **All login UI is a bottom sheet**: `src/components/AuthSheet.tsx` and `src/components/UsernameSheet.tsx` build on `src/components/BottomSheet.tsx`. Use its `zClassName` prop to stack sheets — a z-index via `className` moves only the panel and leaves the backdrop behind. Blocking sheets pass `dismissable={false}` (inert backdrop + Escape) and `showHandle={false}`.
- **Settings is a stack of sheets**: `src/app/profile/_components/SettingsSheet.tsx` is a full-height `BottomSheet`, and everything deeper (`AboutSheet`, `AcknowledgementsSheet`, plus the shared `HowToPlaySheet` and `LeagueGuideSheet`) opens on top of it at `z-[90]` via `zClassName`. One `nested` state holds which is open, so two can never stack. While anything is stacked, settings passes `dismissable={false}`: Escape is a window listener in every sheet, so both would hear one keypress and the player would lose settings along with the thing they dismissed. Rows come from `SettingsRow.tsx` — `SettingsRow` for tappable (an `<a>` when given `href`, so long-press and open-in-new-tab still work), `SettingsField` for read-only, deliberately with no chevron since an affordance would promise an editor that does not exist.
- **Reference sheets have no trigger**: `HowToPlaySheet` and `LeagueGuideSheet` are controlled and own no button, because home, the leaderboard and settings each open the same content from their own affordance. `HowToPlay.tsx` is just the home screen's button wrapped around the sheet. Add a new door by rendering the sheet, never by copying the rules.
- **The rules are text, not a component**: the four headline rules live in `src/lib/game/rules.ts`, read by both `HowToPlaySheet` (the short version) and `/how-to-play` (the public long version). That page is the site's only substantial crawlable content — everything else is behind the login wall, where a bot sees a wordmark and two buttons — so it exists for AdSense and search as much as for players, and `AuthSheet` links to it and to the privacy policy because a visitor is asked to sign up before seeing anything else. Numbers on it are imported (`MIN_WORD_LENGTH`, `TURN_LIMIT_HOURS`, `BASE_STARS`, `LEAGUES`) rather than typed, so the guide cannot drift from the engine.
- **App facts live in one module**: `src/lib/app-meta.ts` holds the version, support email, repo links and legal URLs. The version is inlined from `package.json` by `next.config.ts` (`NEXT_PUBLIC_APP_VERSION`) rather than hardcoded, since release-please bumps that file every release and a stale string makes bug reports point at the wrong build. `PRIVACY_URL`/`TERMS_URL` gate their own Support rows, so a legal page that does not exist yet links nobody to a 404 — `TERMS_URL` is still null. `PRIVACY_URL` points at `/legal/privacy`, a real page (not a sheet) so it is linkable and crawlable, with `PRIVACY_UPDATED` as the one date to bump when the text changes.
- **Stars, not Elo**: the ladder currency is `stars` (base 200, floor 0), and the maths lives in `src/lib/game/stars.ts`. It keeps Elo's logistic expected-score curve for opponent sensitivity but splits gain from loss (`BASE_GAIN 20` / `BASE_LOSS 14`, `SWING 16`, clamped to +4…+36 and −2…−30), so it is deliberately **not** zero-sum. That inflation is load-bearing: Elo is mean-preserving, so with everyone starting at the same number the upper league bands would be unreachable by construction. Migration 008 renamed `rating`/`peak_rating`/`rating_games` → `stars`/`peak_stars`/`star_games` and `pN_rating_delta` → `pN_star_delta`, and reset every account.
- **Leagues are derived, never stored**: five bands in `src/lib/account/leagues.ts` (Bronze 0–399, Silver 400–899, Gold 900–1499, Platinum 1500–1999, Diamond 2000+). `leagueForStars` is the only way to get one, so the band and the star count can never disagree and demotion needs no bookkeeping. The module is pure and client-safe; the tier colours live with the artwork in `LeagueIcon.tsx`, not here.
- **One writer for stars**: `computeStarOutcome` in `src/lib/game/stars.server.ts` keeps a compute/commit split. The deltas go into the same conditional `UPDATE ... .neq("status","completed")` that flips a game to completed, and `commit()` runs only if that update returned a row — that is the whole idempotency guard against two requests racing to finish a game. Only games where **both** players have a `user_id` are ranked; unranked games record null deltas.
- **Leaderboard has two scopes**: `/api/account/leaderboard?scope=league|global`, top 100 each, no minimum-games gate. Which league the league scope shows is resolved server-side from the viewer's own stars — a caller cannot ask to be ranked in a band they are not in. Ranks are counted (`countAbove`) rather than read off the list, and the count mirrors the full three-part sort order (stars, then games, then account age); comparing stars alone would report every tied account as joint first.
- **Confirmations**: `src/components/ConfirmDialog.tsx` is the shared "are you sure?" card — the leave warning in `GameBottomBar`, the pass and forfeit dialogs all render it.
- **The board has no header**: every in-game control lives in `GameBottomBar` (`[back] [menu] [emoji] [prev] [next]`), so `ScoreBar` is pure readout and the grid gets the vertical space a header row would have taken. Leaving (plain exit, game continues, rejoinable) is the back seat; forfeiting stays behind the menu so the destructive action is not the first thing under the thumb. The grid's `calc(100dvh - 316px)` cap is the combined height of the panels around it — it has to move whenever one of them does. `ScoreBar` spends that budget carefully: each player is a sideways chip (avatar, then name over score) rather than a stack, which is two lines instead of three.
- **Move review replays, it does not store**: the `[prev] [next]` steppers walk the board back through the history. `src/lib/game/review.ts` is a thin pure layer over the engine's `computeBoardState`, run over a _prefix_ of `serializeGame`'s `history` — so a past board and the live board can never disagree about the rules, and no snapshot is ever persisted. This is why `history` carries `tileIndices`: without the tiles a word cannot be replayed. `useMoveReview` holds the cursor as a 1-based **move number**, not an offset from the end, so a move landing mid-read does not slide the frame the player is looking at. Review is strictly read-only (`canPlay = yourTurn && !isReviewing`) and `ReviewBar` takes `WordPreview`'s seat _and its exact height_ — an extra row would resize the grid, whose cap is the height of everything around it. `ScoreBar` takes the frame's scores for the same reason: counting tiles that are not on screen would be a lie.
- **Inline SVGs use per-instance ids**: any icon with a gradient or clip-path derives its ids from `useId()`. `LeagueIcon.tsx` has eleven gradients and a leaderboard renders a hundred copies of it, so this is not hypothetical there. Hardcoded ids break when the same icon renders twice — unmounting one copy leaves the others pointing at a removed gradient, so they paint unfilled until a repaint.

## Project Structure

```
src/
├── app/
│   ├── auth/callback/     # Completes Google + magic-link sign-in
│   ├── api/account/       # Account endpoints
│   │   ├── claim/         # Link account to guest row, merge history
│   │   ├── summary/       # Username, stars, league, streak for the current caller
│   │   ├── username/      # Claim a username (+ /check for availability)
│   │   ├── avatar/        # Change the caller's avatar
│   │   └── leaderboard/   # Top 100 by league or globally + viewer's ranks
│   ├── api/game/          # Server-side game mutation endpoints
│   │   ├── create/        # Create a new game lobby
│   │   ├── join/          # Join a game by code
│   │   ├── start/         # Start the game from lobby
│   │   ├── move/          # Submit a word
│   │   ├── pass/          # Pass a turn
│   │   ├── forfeit/       # Forfeit the game
│   │   ├── timeout/       # Handle turn expiry
│   │   ├── sweep/         # Lock eligible tiles after a move
│   │   ├── lobby/         # Lobby state polling
│   │   ├── fetch/         # Fetch full game state
│   │   ├── leave/         # Leave lobby before game starts
│   │   └── destroy/       # Clean up abandoned games
│   ├── how-to-play/       # Public long-form rules — the crawlable content
│   ├── legal/privacy/     # Privacy policy — public, outside the login wall
│   ├── game/[code]/       # Game page
│   │   └── _components/   # GameClient, WaitingLobby, ActionBar, ScoreBar, etc.
│   └── join/              # Join page
├── components/            # Shared UI components (AuthSheet, BottomSheet, Tile, etc.)
├── hooks/                 # use-session, use-auth, use-account, use-leaderboard, use-mobile
├── lib/
│   ├── account/           # Names, leagues, username/leaderboard services, timezone
│   ├── auth/              # Redirect validation for the auth callback
│   └── game/              # Engine, service, identity, stars, streak, dictionary
├── middleware.ts          # Supabase session cookie refresh (edge runtime)
└── integrations/supabase/ # Supabase clients (browser, service-role, request-scoped)
```

## Development Commands

```bash
npm run dev       # Start local dev server
npm run build     # Next.js production build
npm run deploy    # Build for Cloudflare + wrangler deploy
npm run lint      # ESLint
npm run format    # Prettier
```

## Conventions

- Tailwind CSS v4 for all styling — no inline styles.
- `"use client"` directive is required for any component using hooks or browser APIs.
- Keep game route handlers thin: validate input with Zod (extend `callerSchema`), call `resolveCaller`, delegate to `service.server.ts`, return updated state.
- Tile grid is always 5×5 (25 tiles). Grid indices are 0–24, row-major order.
