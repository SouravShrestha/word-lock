# Word Lock — Agent Notes

Word Lock is a real-time 2-player word territory game built on **Next.js 15 App Router**, deployed to **Cloudflare Workers** via OpenNext. There is also an **Expo** client for iOS and Android in `apps/mobile`.

## Key Architecture Decisions

- **This is an npm-workspaces monorepo driven by Turborepo.** `apps/web` is the Next app and the only thing that talks to the database; `apps/mobile` is the Expo client; `packages/*` is what they share. Paths in this document that start with `src/` are inside `apps/web` unless the bullet says otherwise. `supabase/` stays at the repo root because migrations belong to neither client. One `npm install` at the root covers every workspace, and every script in Development Commands runs from the root.
- **`@word-lock/core` is the one copy of the rules.** Every module that is a pure decision — the engine, the star maths, league bands, move review, streaks, stats, username rules, avatar ids, `public-routes` — lives in `packages/core` and is imported by both clients as `@word-lock/core/game`, `/account`, `/auth` or `/db`. It has **zero runtime dependencies** and that is enforced three ways: its tsconfig drops the `dom` library, the eslint config bans `node:*`, `next/*`, `react*` and any `.server` import inside it, and `scripts/check-boundaries.mjs` fails the lint task if a `dependencies` field ever appears. The package ships TypeScript source with no build step — Metro reads TS natively, and `transpilePackages` in `next.config.ts` is what lets webpack do the same — so an edit to the engine is visible to both apps immediately. Import the domain subpath, not a path into the package. Nothing in core may read `process.env` except `build-env.ts`, which exists because Next and Expo inline _different_ variable names and `avatarUrl` needs the Supabase origin on both.
- **Colours are authored once, in `@word-lock/tokens`.** `packages/tokens/src/tokens.ts` is the source; `scripts/generate.mjs` emits three artifacts: `generated/tokens.css` (the web's `:root`/`.dark` blocks, imported by `globals.css`, values **verbatim**), `generated/tokens.native.ts` (every token resolved to sRGB as a plain JS object, for direct reads like `colors[resolvedTheme]`), and `generated/tokens.native.css` (the same sRGB values as `:root`/`.dark` custom properties, for NativeWind's runtime — see the `apps/mobile` bullet below for why this is a third artifact and not `tokens.css` reused). All three are committed — Tailwind has to `@import` a real file with no build step in front of it, and a committed artifact makes a palette change a reviewable colour diff. Change a colour, then run `npm run generate --workspace @word-lock/tokens`; `tokens.test.ts` fails if you forget. Tailwind's `@theme inline` mapping stays in `globals.css`, because which tokens become utilities is a Tailwind concern rather than a token one. **Sixteen token/theme pairs are outside sRGB**, including the player colours `--p1`/`--p1-soft`/`--p2-soft`, so those swatches are genuinely slightly less vivid on a phone than in a browser on a P3 display; every affected value is annotated `// clamped from …` in the generated native map. Notation is deliberately not normalised — re-authoring by eye would change the palette.
- **`@word-lock/icons` is the shared icon set — duplicated, not platform-resolved.** The first design tried was `.web.tsx`/`.native.tsx` files under one bare `import ... from "./primitives"` per icon, the way React Native community packages usually split platform code — Metro resolves that suffix convention by default, but this repo's Next/webpack build has no matching `resolve.extensions`/condition config, and adding one was judged riskier than the alternative. So instead, **every icon exists as two files**: `src/<Name>.tsx` (plain lowercase SVG DOM tags, `aria-hidden="true"`) and `src/native/<Name>.tsx` (the same icon via `react-native-svg`'s `Svg`/`Path`/`Defs`/`LinearGradient`/`Stop`/etc., `accessibilityElementsHidden` instead of `aria-hidden`) — `apps/web` imports from `@word-lock/icons`, `apps/mobile` imports from `@word-lock/icons/native`, and both export the same component names with the same `{ size?: number; color?: string }` props (`types.ts`), so a call site reads identically either way; only the import path differs. Icons with real path/gradient data worth protecting from drifting between the two (`LeagueIcon`'s five-tier palette and eight-feather geometry, `TrophyNavIcon`'s six gradients) factor that data into a sibling `*Data.ts` file imported by both renderers — `leagueIconData.ts`, `nav/trophyNavIconData.ts` — so only the JSX tag layer is actually duplicated, not the numbers. Gradient/clip-path ids still use `useId()` exactly as the web originals did (`StreakIcon`, `nav/HomeNavIcon`, `LeagueIcon`, `TrophyNavIcon`) — a leaderboard rendering a hundred `LeagueIcon`s at once is the reason this matters on either platform, not a web-only concern. **`apps/web` has not been migrated to this package** — its original per-file icons in `src/components/icons` are untouched and still what every current web call site imports; only `apps/mobile` consumes `@word-lock/icons` so far. Migrating a web screen to the shared icons happens opportunistically, screen by screen, whenever Tasks 13+ touch it anyway — not as a single sweeping rewrite, since the prop APIs differ enough (`size`/`color` only, no `className`, no arbitrary `SVGProps` spread) that translating 30-odd existing call sites blind was judged not worth the risk. Do not port the separate `createIcon`-factory lucide-style system in `apps/web/src/components/icons/index.tsx` (`Copy`, `Check`, `ChevronDown`, etc.) into this package — it is a different, unrelated icon convention used for a handful of UI chrome icons, not part of the 47-icon set this package covers.
- **`@word-lock/client` is the client/server seam, shared.** Everything that is logic-but-not-pure — the API layer (`configureApiClient`, every `*Fn` request function), the session and auth state machines, and the account/leaderboard/move-review query hooks — lives in `packages/client` and is imported as `@word-lock/client`. Platform differences are **injected, never branched on**: there is no `typeof window` or `Platform.OS` check anywhere in it. Three seams carry the difference instead — `ApiConfig` (base URL + `getAuthHeaders`, defaulting to same-origin-plus-cookies, which is the web's configuration and needs no setup call), `ClientPlatform` (storage + id generation, promise-based throughout because AsyncStorage is), and `AuthAdapter` (how sign-in actually happens; `signInWithGoogle` is optional on the interface because iOS omits it — offering a third-party social login without Sign in with Apple alongside it is an App Store rejection, and email-only sidesteps that). `apps/web/src/lib/{client-platform,auth-adapter}.ts` are the web's two adapters; the mobile app gets its own in Task 8/9. The three provider components (`SessionProvider`, `AuthProvider`, `QueryProvider` in `apps/web/src/components`) are now thin wrappers that supply the web adapter and otherwise defer to the shared provider of the same name.
- **`apps/mobile` is Expo + `expo-router`, on NativeWind over the same tokens.** SDK 57, Tailwind v3 (NativeWind 4 targets v3; `apps/web` is the one on v4). `tailwind.config.js` maps `@word-lock/tokens/native`'s colour names onto `var(--name)` references — actual values live in `src/app/globals.css`'s `:root`/`.dark` blocks, generated by the _same_ `packages/tokens/scripts/generate.mjs` that emits the web's `tokens.css`, as a third artifact (`tokens.native.css`) with every colour pre-resolved to sRGB, because NativeWind's CSS-variable runtime cannot parse `oklch()` any more than plain React Native can (see the "Colours are authored once" bullet above; `tokens.native.ts` and `tokens.native.css` share the same resolved values, one as a JS object for direct reads like `colors[resolvedTheme]`, one as CSS for NativeWind's `className` resolution). `metro.config.js` watches the monorepo root and adds its `node_modules` to the resolver — required because the shared packages ship TypeScript source with no build step, same reasoning as `apps/web`'s `transpilePackages`. `ThemeProvider.tsx` is the three-state (light/dark/system) equivalent of the web's `next-themes` setup, backed by AsyncStorage instead of a cookie and calling NativeWind's own `useColorScheme().setColorScheme()` to flip the `.dark` class. The routing tree mirrors the web's screens 1:1 — a `(tabs)` group for the four `BottomNav` destinations, plus `game/[code]`, `join`, `how-to-play`, `legal/privacy` as stack routes — with every screen a placeholder until its numbered task lands. `AppProviders.tsx` nests `ClientPlatformProvider` → `ThemeProvider` → the shared `SessionProvider`/`QueryProvider`, matching `apps/web`'s provider order; the auth slot is a no-op placeholder until Task 9 supplies a real `AuthAdapter`. `src/lib/client-platform.ts` is this platform's `ClientPlatform`: AsyncStorage (already promise-based, so no wrapping needed) and `expo-crypto`'s `randomUUID` in place of `crypto.randomUUID`, which Hermes does not have.
- **The mobile app is a client, not a peer.** It has no Supabase service-role access and no route handlers of its own. Every mutation goes to the same `/api/*` endpoints the web app calls, over an injected base URL, and identity arrives as an `Authorization: Bearer` token instead of a cookie. `apps/web` remains the single authoritative backend, which is why nothing in the server layer needs a platform check. `apps/mobile/src/lib/supabase.ts` is this platform's Supabase client: plain `createClient` (not `createBrowserClient` — there is no cookie jar on a device) over `AsyncStorage`, PKCE flow, and an `AppState` listener that starts/stops the background token-refresh timer as the app foregrounds/backgrounds, since RN has no page-visibility equivalent to do that on its own. `apps/mobile/src/components/AppProviders.tsx` calls `configureApiClient` at module scope — before any screen can mount — pointing `baseUrl` at `EXPO_PUBLIC_API_URL` and reading the bearer token fresh from `supabase.auth.getSession()` on every request, since the token refreshes in the background and a cached copy would eventually be stale. `react-native-get-random-values` is imported first in `_layout.tsx`, before `react-native-url-polyfill/auto` — Hermes has no WebCrypto, and `supabase-js`'s PKCE flow needs `crypto.getRandomValues` to generate the code verifier.
- **Mobile sign-in: email everywhere by typed code, Google everywhere except iOS.** `apps/mobile/src/lib/auth-adapter.ts` is this platform's `AuthAdapter`. There is no `/auth/callback` route on a device for a magic link to land on, so `signInWithEmail` omits `emailRedirectTo` and returns `{ kind: "code-sent" }`; `verifyEmailCode` finishes with `supabase.auth.verifyOtp({ email, token: code, type: "email" })`. The one shared "Magic Link or OTP" email template carries both `{{ .ConfirmationURL }}` (web's link) and `{{ .Token }}` (this platform's 6-digit code) — the same email serves either flow, and whichever variable the recipient acts on consumes the one-time code underneath, invalidating the other. `signInWithGoogle` is `Platform.OS === "ios" ? undefined : signInWithGoogleNative` — the App Store rule pairing third-party social login with Sign in with Apple is what rules Google out on iOS specifically, not a platform limitation; Android and this platform's web build both offer it. The native Google flow has no cookie-writing server route to redirect to, so it opens the OAuth URL itself via `expo-web-browser`'s `openAuthSessionAsync` (`signInWithOAuth({ ..., skipBrowserRedirect: true })` supplies the URL) against the `wordlock://auth/callback` redirect (`app.config.ts`'s `scheme`), then completes with `exchangeCodeForSession` on the `code` query param — `openAuthSessionAsync` intercepts that redirect and returns it directly, so no dedicated route/screen has to exist for it to land on. `claimAccountFn` needs no separate wiring here: `useClaimGuest` (mounted inside `@word-lock/client`'s shared `AuthProvider`) is purely reactive to `useAuth()`/`useSession()` state, so it merges the guest session on this platform for free once a real signed-in `user` appears.
- **The login wall, native.** `apps/mobile/src/components/AuthGate.tsx` mirrors `apps/web`'s: reads the same `isPublicRoute` list from `@word-lock/core/auth`, keyed off `expo-router`'s `usePathname()`, and renders `AuthSheet`/`UsernameSheet` unconditionally everywhere else — each sheet still owns its own `open` state, so the gate only decides whether either can exist on this route at all. Mounted in `AppProviders.tsx` as a sibling to `{children}`, inside `SharedAuthProvider` (needs `useAuth()`) and alongside the screen content (its sheets have to cover it). `apps/mobile/src/components/BottomSheet.tsx` is the Task 11 `@gorhom/bottom-sheet`-backed version — it superseded the earlier from-scratch RN `Modal` stand-in built ahead of that dependency landing — wrapping `BottomSheetModal` with the same contract (`open`, `dismissable`, `showHandle`, `label`) `AuthSheet`/`UsernameSheet` already relied on, plus a `useSheetStack` coordinator so nested sheets (settings' stack) behave the way `zClassName` does on the web. `AuthSheet.tsx`/`UsernameSheet.tsx` port the web versions' logic as-is (same debounce, same mutations, same "back arrow signs out" mechanic in `UsernameSheet`) with two additions `useAuth()`'s `canSignInWithGoogle`/`usesEmailCode` flags already existed to support: the Google button only renders when `canSignInWithGoogle`, and `signInWithEmail`'s `code-sent` outcome always leads to a typed-code step rather than the web's "check your inbox" screen.
- **Server-authoritative game logic**: All state mutations go through `src/app/api/game/*/route.ts` route handlers. Clients never mutate game state directly — they call these endpoints and receive updates via Supabase Realtime.
- **Identity has one seam**: `resolveCaller(request, body)` in `src/lib/game/identity.server.ts` builds a `Caller`, and `resolvePlayer(caller)` turns it into a `wl_players` row. A logged-in caller is identified by their **verified** `user_id` and the body's `sessionId` is ignored; only a guest falls back to it. Never resolve a player from a raw session id anywhere else. Verification itself happens in `getVerifiedUser` (`src/integrations/supabase/client.route.ts`), which checks two kinds of credential, in this order: an `Authorization: Bearer <jwt>` header first (the mobile app's only credential — verified against a keyless client with `getClaims`/`getUser(jwt)`, never touching the request's cookies), then the session cookie (the web app's, unchanged). A request carrying both resolves by the bearer token alone — the cookie is never consulted once a bearer credential is present, so a stale cookie can never silently override it. Either credential, forged or expired, resolves as a guest rather than as someone else. Route handlers need no changes for this: `applyCookies` is already called unconditionally on every response and is a no-op when nothing was buffered to write, which is always true for a bearer caller.
- **Login is mandatory (client-side)**: an account is required to play. `useAuth().isLoginRequired` is derived (`ready && !user`), and `AuthSheet` renders as a non-dismissable wall whenever it is true — there is no guest mode and no "open the login sheet" call anywhere. The wall is mounted once as `AuthGate`, which is also the **only** place that asks whether a screen needs an account: on a route listed in `packages/core/src/auth/public-routes.ts` (`/legal/*`, `/how-to-play`) neither sheet is rendered at all, because a privacy policy nobody can read without signing up is useless to the person deciding whether to sign up — and ad networks crawl that URL logged out. Do not add a second such check anywhere; add the path to that list. Taking a seat is enforced server-side too: `createGame`/`joinGame` (`lifecycle.server.ts`) reject a guest (401) or an account with no username yet (403), and both clients' game screens hold their invite-link auto-join until `useHasPlayableAccount()` is true — a screen mounted behind the wall still runs its effects. Other API routes **still accept a guest `sessionId`**. `wl_claim_player` (migration 005) still merges a pre-existing guest row into an account on first login.
- **Server-only modules**: Files suffixed `.server.ts` (e.g. `src/lib/game/service.server.ts`, `src/lib/game/dictionary.server.ts`, `src/integrations/supabase/client.server.ts`) must **never** be imported in client components. They contain server-side secrets and node-only APIs.
- **Game engine**: Core tile-claiming, locking, and scoring logic lives in `packages/core/src/game/engine.ts`. This is shared between server route handlers.
- **Client API layer**: `@word-lock/client` (import from `"@word-lock/client"`, not a path into the package) is the only place client components should call API routes. Do not `fetch` game endpoints inline in components. It used to be `src/lib/game/api.client.ts`; that file is gone, and every call site now imports the same function names from the shared package.
- **Realtime**: `src/integrations/supabase/client.ts` sets up the Supabase browser client used for Realtime subscriptions inside `GameClient.tsx`.
- **Session identity**: `useSession`/`useSessionState` (from `@word-lock/client`, moved out of `src/hooks/use-session.ts`) hold only the session ID, via whatever `ClientPlatform.storage` the app injected — `localStorage` on the web. It is not an identity — a logged-in caller is identified server-side by their verified `user_id`, and the session ID exists so a row can be created before sign-in and adopted by `wl_claim_player` after. It carries no name, and is reset on sign-out.
- **Auth**: Supabase Auth with Google OAuth and magic links, cookie-based via `@supabase/ssr` on the web. `src/middleware.ts` refreshes the session cookie, `src/app/auth/callback/route.ts` completes every sign-in, and `useAuth` (from `@word-lock/client`) is the only place client components read auth state — the state machine itself is shared, `apps/web/src/lib/auth-adapter.ts` supplies the web's sign-in mechanics. `src/integrations/supabase/client.route.ts` provides the request-scoped auth client for route handlers, and is also where a mobile caller's bearer token is verified (see the identity bullet above).
- **One name per player**: `username` is it — the name opponents see on the score bar, in the lobby and in match history, and the name the leaderboard ranks. Unique (case-insensitively), and settable **once**. Rules live in `packages/core/src/account/names.ts`. There used to be a separate editable `display_name`; migration 006 dropped it. A name never travels in a request payload: `callerSchema` carries only `sessionId` and `timezone`, and the only naming write in the app is `/api/account/username`. `serializeGame` maps `username` → `players.one/two.name`, falling back to `UNNAMED_PLAYER` since the column is nullable.
- **Picking a username is mandatory too**: `UsernameSheet` blocks any logged-in account whose `username` is null, so login and naming are one two-step gate. Its only exit is backwards: a back arrow (plus a "Wrong account?" link) calls `signOut()`, which flips `isLoginRequired` and hands the screen to `AuthSheet`. Nothing navigates and nothing is destroyed — the account keeps its stars and games, so logging back in returns to the same sheet. A cross would be the wrong glyph here: there is no state to dismiss to.
- **Avatars are stored ids, not URLs**: `wl_players.avatar` (migration 009) holds `avatar_01`-style ids, `NOT NULL DEFAULT 'avatar_01'`, with a CHECK on the _shape_ only — the set grows, and `isAvatarId` in `packages/core/src/account/avatars.ts` is what decides which ids exist. That pure, client-safe module is the only place the bucket name, the `.png` and the Supabase host are composed into a URL (`avatarUrl`), so moving the files is never a data migration. `src/components/Avatar.tsx` is the single renderer — plain `<img>`, not `next/image`, since the deploy target is Cloudflare Workers and these are small PNGs on a public bucket. Avatars replaced the hash-derived panda/monkey icons: a face is now read from the row rather than invented per surface, which is why the same player looks the same in the lobby, on their profile and in someone else's match history. Freely changeable (`setAvatar`), unlike the username — it is a picture, not an identity.
- **All login UI is a bottom sheet**: `src/components/AuthSheet.tsx` and `src/components/UsernameSheet.tsx` build on `src/components/BottomSheet.tsx`. Use its `zClassName` prop to stack sheets — a z-index via `className` moves only the panel and leaves the backdrop behind. Blocking sheets pass `dismissable={false}` (inert backdrop + Escape) and `showHandle={false}`.
- **Settings is a stack of sheets**: `src/app/profile/_components/SettingsSheet.tsx` is a full-height `BottomSheet`, and everything deeper (`AboutSheet`, `AcknowledgementsSheet`, plus the shared `HowToPlaySheet` and `LeagueGuideSheet`) opens on top of it at `z-[90]` via `zClassName`. One `nested` state holds which is open, so two can never stack. While anything is stacked, settings passes `dismissable={false}`: Escape is a window listener in every sheet, so both would hear one keypress and the player would lose settings along with the thing they dismissed. Rows come from `SettingsRow.tsx` — `SettingsRow` for tappable (an `<a>` when given `href`, so long-press and open-in-new-tab still work), `SettingsField` for read-only, deliberately with no chevron since an affordance would promise an editor that does not exist.
- **Reference sheets have no trigger**: `HowToPlaySheet` and `LeagueGuideSheet` are controlled and own no button, because home, the leaderboard and settings each open the same content from their own affordance. `HowToPlay.tsx` is just the home screen's button wrapped around the sheet. Add a new door by rendering the sheet, never by copying the rules.
- **The rules are text, not a component**: the four headline rules live in `packages/core/src/game/rules.ts`, read by both `HowToPlaySheet` (the short version) and `/how-to-play` (the public long version). That page is the site's only substantial crawlable content — everything else is behind the login wall, where a bot sees a wordmark and two buttons — so it exists for AdSense and search as much as for players, and `AuthSheet` links to it and to the privacy policy because a visitor is asked to sign up before seeing anything else. Numbers on it are imported (`MIN_WORD_LENGTH`, `TURN_LIMIT_HOURS`, `BASE_STARS`, `LEAGUES`) rather than typed, so the guide cannot drift from the engine.
- **App facts live in one module**: the platform-independent ones — support email, authorship, repo links, `PRIVACY_URL`/`TERMS_URL`, `PRIVACY_UPDATED`, and the `supportMailtoFor` body — are in `packages/core/src/app/facts.ts`. `src/lib/app-meta.ts` re-exports all of them and adds the three that genuinely differ per platform: `APP_VERSION`, `siteUrl()` (which can fall back to `window.location.origin`) and `supportMailto()` (which reads `navigator.userAgent`). Keep importing from `@/lib/app-meta` on the web; the mobile app has its own counterpart reading the version from `app.config.ts`. The version is inlined from `package.json` by `next.config.ts` (`NEXT_PUBLIC_APP_VERSION`) rather than hardcoded, since release-please bumps that file every release and a stale string makes bug reports point at the wrong build. `PRIVACY_URL`/`TERMS_URL` gate their own Support rows, so a legal page that does not exist yet links nobody to a 404 — `TERMS_URL` is still null. `PRIVACY_URL` points at `/legal/privacy`, a real page (not a sheet) so it is linkable and crawlable, with `PRIVACY_UPDATED` as the one date to bump when the text changes.
- **Account deletion is in-app, not email support** (App Store guideline 5.1.1(v)): `POST /api/account/delete`, following the same thin-handler pattern as every other route — validate with `callerSchema`, `resolveCaller`, delegate, done. `deleteAccount` in `service.server.ts` never deletes the `wl_players` row itself: it is `player1_id` on some games with no fallback, and `wl_moves` cascades from `wl_games`, so removing it would either violate a NOT NULL constraint or erase an opponent's own match history the moment the caller who happened to go second deletes their account. Instead: every unfinished game the caller is part of is routed to whichever existing function already handles that shape (`destroyGame` for a waiting lobby they created, `leaveLobby` for one they joined, `forfeitGame` — a real, scored result — for an active game), then migration 014's `wl_delete_account` detaches the row from the auth identity (`user_id`, `username` → null, freeing the username for reuse), then the route handler deletes the `auth.users` row via `getSupabaseAdmin().auth.admin.deleteUser` — in that order, because deleting the auth user first would mean a slow or retried request resolves a caller that no longer verifies. Stars, streak, avatar and match history stay on the row: they describe games that happened, jointly with whichever opponents played them, and are not the caller's alone to erase. The Settings sheet's "Delete account" row sits in its own "Danger zone" section, behind a `ConfirmDialog`, and signs out locally only after the server call succeeds.
- **Stars, not Elo**: the ladder currency is `stars` (base 200, floor 0), and the maths lives in `packages/core/src/game/stars.ts`. It keeps Elo's logistic expected-score curve for opponent sensitivity but splits gain from loss (`BASE_GAIN 20` / `BASE_LOSS 14`, `SWING 16`, clamped to +4…+36 and −2…−30), so it is deliberately **not** zero-sum. That inflation is load-bearing: Elo is mean-preserving, so with everyone starting at the same number the upper league bands would be unreachable by construction. Migration 008 renamed `rating`/`peak_rating`/`rating_games` → `stars`/`peak_stars`/`star_games` and `pN_rating_delta` → `pN_star_delta`, and reset every account.
- **Leagues are derived, never stored**: five bands in `packages/core/src/account/leagues.ts` (Bronze 0–399, Silver 400–899, Gold 900–1499, Platinum 1500–1999, Diamond 2000+). `leagueForStars` is the only way to get one, so the band and the star count can never disagree and demotion needs no bookkeeping. The module is pure and client-safe; the tier colours live with the artwork in `LeagueIcon.tsx`, not here.
- **One writer for stars**: `computeStarOutcome` in `src/lib/game/stars.server.ts` keeps a compute/commit split. The deltas go into the same conditional `UPDATE ... .neq("status","completed")` that flips a game to completed, and `commit()` runs only if that update returned a row — that is the whole idempotency guard against two requests racing to finish a game. Only games where **both** players have a `user_id` are ranked; unranked games record null deltas.
- **Leaderboard has two scopes**: `/api/account/leaderboard?scope=league|global`, top 100 each, no minimum-games gate. Which league the league scope shows is resolved server-side from the viewer's own stars — a caller cannot ask to be ranked in a band they are not in. Ranks are counted (`countAbove`) rather than read off the list, and the count mirrors the full three-part sort order (stars, then games, then account age); comparing stars alone would report every tied account as joint first.
- **Confirmations**: `src/components/ConfirmDialog.tsx` is the shared "are you sure?" card — the leave warning in `GameBottomBar`, the pass and forfeit dialogs all render it.
- **The board has no header**: every in-game control lives in `GameBottomBar` (`[back] [menu] [emoji] [prev] [next]`), so `ScoreBar` is pure readout and the grid gets the vertical space a header row would have taken. Leaving (plain exit, game continues, rejoinable) is the back seat; forfeiting stays behind the menu so the destructive action is not the first thing under the thumb. The grid's `calc(100dvh - 316px)` cap is the combined height of the panels around it — it has to move whenever one of them does. `ScoreBar` spends that budget carefully: each player is a sideways chip (avatar, then name over score) rather than a stack, which is two lines instead of three.
- **Move review replays, it does not store**: the `[prev] [next]` steppers walk the board back through the history. `packages/core/src/game/review.ts` is a thin pure layer over the engine's `computeBoardState`, run over a _prefix_ of `serializeGame`'s `history` — so a past board and the live board can never disagree about the rules, and no snapshot is ever persisted. This is why `history` carries `tileIndices`: without the tiles a word cannot be replayed. `useMoveReview` holds the cursor as a 1-based **move number**, not an offset from the end, so a move landing mid-read does not slide the frame the player is looking at. Review is strictly read-only (`canPlay = yourTurn && !isReviewing`) and `ReviewBar` takes `WordPreview`'s seat _and its exact height_ — an extra row would resize the grid, whose cap is the height of everything around it. `ScoreBar` takes the frame's scores for the same reason: counting tiles that are not on screen would be a lie.
- **Inline SVGs use per-instance ids**: any icon with a gradient or clip-path derives its ids from `useId()`. `LeagueIcon.tsx` has eleven gradients and a leaderboard renders a hundred copies of it, so this is not hypothetical there. Hardcoded ids break when the same icon renders twice — unmounting one copy leaves the others pointing at a removed gradient, so they paint unfilled until a repaint.

## Project Structure

```
word-lock/
├── apps/
│   ├── web/               # Next.js app — the tree below, plus next.config.ts,
│   │                      # wrangler.toml, open-next.config.ts, .env.local
│   └── mobile/            # Expo app (iOS + Android) — see below
├── packages/
│   ├── core/              # @word-lock/core — pure, zero-dependency
│   │   └── src/
│   │       ├── game/      # engine, stars, review, streak, stats,
│   │       │              # star-history, viewer, rows, rules, reactions, format
│   │       ├── account/   # leagues, avatars, names, timezone, leaderboard.constants
│   │       ├── app/       # support email, repo links, legal paths, PRIVACY_UPDATED
│   │       ├── auth/      # public-routes, redirect
│   │       ├── db/        # generated Supabase types
│   │       └── build-env.ts  # the only process.env read in core
│   ├── tokens/             # @word-lock/tokens — also zero-dependency
│   │   ├── src/tokens.ts  # THE source of every colour
│   │   ├── src/color.ts   # OKLCH -> sRGB, hand-written
│   │   ├── scripts/generate.mjs
│   │   └── generated/     # committed: tokens.css, tokens.native.ts, tokens.native.css
│   ├── icons/               # @word-lock/icons — every icon written twice, not shared via a
│   │   └── src/            # platform-resolved file: apps/web is not migrated to this yet
│   │       ├── <Name>.tsx        # web icon (plain SVG DOM tags) — the "." export
│   │       ├── nav/<Name>.tsx    # web nav icons
│   │       ├── native/<Name>.tsx # native counterpart (react-native-svg) — the "./native" export
│   │       ├── native/nav/<Name>.tsx
│   │       ├── *Data.ts          # shared path/gradient data for icons with real geometry
│   │       ├── types.ts          # IconProps ({ size?, color? }), DEFAULT_ICON_SIZE
│   │       ├── index.ts          # web barrel
│   │       └── native.ts         # native barrel
│   └── client/             # @word-lock/client — the client/server seam
│       └── src/
│           ├── api/       # configureApiClient, every *Fn request function
│           ├── session/   # useSession/useSessionState
│           ├── auth/      # useAuth/useAuthState, AuthAdapter, useClaimGuest
│           ├── queries/   # useAccount, useLeaderboard, retry policy
│           ├── game/      # useMoveReview
│           ├── platform.ts   # ClientPlatform (storage + id generation)
│           └── providers.tsx # the shared provider components
├── scripts/
│   └── check-boundaries.mjs  # asserts core stays dependency-free
├── supabase/migrations/   # Shared infrastructure, owned by neither app
├── turbo.json
└── tsconfig.base.json
```

`apps/mobile/`:

```
src/
├── app/                   # expo-router file-based routes
│   ├── _layout.tsx        # Fonts, AppProviders, the root <Stack>
│   ├── (tabs)/            # BottomNav's four destinations, as a native tab bar
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Home / lobby        — Task 13, done
│   │   ├── history.tsx    # Match history        — Task 20, done
│   │   ├── leaderboard.tsx # Leaderboard          — Task 20, done
│   │   └── profile.tsx    # Profile + settings   — Task 19, done
│   ├── game/[code].tsx    # The board             — Tasks 16-18, done
│   ├── join.tsx           # Join by room code    — Task 14, done
│   ├── how-to-play.tsx    # Public, reachable without an account — Task 21, done
│   ├── legal/privacy.tsx  # Public, reachable without an account — Task 21, done
│   └── globals.css        # @import tokens.native.css; @tailwind directives
├── components/
│   ├── AppProviders.tsx   # Platform -> Theme -> Session -> Query -> Auth (Task 9, done)
│   └── Shell.tsx          # Game screen frame, useSafeAreaInsets instead of dvh/env()
├── theme/
│   └── ThemeProvider.tsx  # light/dark/system over AsyncStorage + NativeWind's useColorScheme
└── lib/
    └── client-platform.ts # ClientPlatform: AsyncStorage + expo-crypto.randomUUID
```

Tasks 7–21 have all landed: the routing tree, token pipeline, provider stack, every screen above, and the real `@gorhom/bottom-sheet`-backed `BottomSheet.tsx` (superseding the from-scratch stand-in Task 11 originally shipped ahead of that dependency) are implemented, not placeholders. `metro.config.js` watches the monorepo root and widens `nodeModulesPaths` so the shared packages' TypeScript source resolves the same way `transpilePackages` makes it resolve on the web. `apps/mobile/tsconfig.json` does **not** extend the shared `tsconfig.base.json` — Expo's own base sets compiler options (`jsx: "react-native"`, Metro-specific resolution) that would fight a layered config, so this is the one workspace with its own compiler contract.

`apps/web/`:

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
│   │                      # SessionProvider/AuthProvider/QueryProvider here are
│   │                      # thin wrappers supplying the web adapter to @word-lock/client
├── hooks/                 # use-mobile only — everything else moved to @word-lock/client
├── lib/                   # What is left here is server-side or web-only.
│   │                      # The pure modules moved to @word-lock/core;
│   │                      # the API layer and query hooks moved to @word-lock/client.
│   ├── account/           # service.server, leaderboard.server
│   ├── game/              # service.server, identity.server, stars.server,
│   │                      # streak.server, dictionary.server, wordlist.server
│   ├── http/errors.ts     # PublicError + NextResponse helpers
│   ├── app-meta.ts        # Version, support email, legal URLs
│   ├── client-platform.ts # ClientPlatform for @word-lock/client: localStorage
│   ├── auth-adapter.ts    # AuthAdapter for @word-lock/client: redirect + cookie flow
│   └── utils.ts           # cn() — clsx + tailwind-merge
├── middleware.ts          # Supabase session cookie refresh (edge runtime)
└── integrations/supabase/ # Supabase clients (browser, service-role, request-scoped)
                           # and cookie-header parsing
```

## Development Commands

All from the repo root. `build`, `typecheck` and `test` fan out across
workspaces through Turborepo and are cached.

```bash
npm run dev       # Web dev server on :3000
npm run build     # Build every workspace
npm run typecheck # tsc --noEmit everywhere
npm test          # vitest run everywhere
npm run deploy    # Build for Cloudflare + wrangler deploy (web only)
npm run lint      # ESLint across the repo
npm run format    # Prettier
```

Scope to one workspace with `npm run <script> --workspace @word-lock/web` or
`npx turbo run <task> --filter @word-lock/core`. The OpenNext and wrangler
steps must run inside `apps/web`, where `wrangler.toml` lives.

The mobile app is started from inside `apps/mobile` rather than the root,
since `expo start` needs its own long-lived process and flags
(`--android`/`--ios`/`--web`) that the root scripts do not forward:

```bash
npm run start --workspace @word-lock/mobile   # or: cd apps/mobile && npx expo start
```

## Conventions

- Tailwind CSS v4 for all styling — no inline styles.
- `"use client"` directive is required for any component using hooks or browser APIs.
- Keep game route handlers thin: validate input with Zod (extend `callerSchema`), call `resolveCaller`, delegate to `service.server.ts`, return updated state.
- Tile grid is always 5×5 (25 tiles). Grid indices are 0–24, row-major order.
