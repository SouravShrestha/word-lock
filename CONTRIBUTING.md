# Contributing to Word Lock

Thanks for taking an interest. Word Lock is a real-time 2-player word territory game built on Next.js 15 (App Router) and deployed to Cloudflare Workers via OpenNext.

This guide covers how to get the project running, the checks your change has to pass, and the few architectural rules that are easy to break by accident.

- [Code of Conduct](#code-of-conduct)
- [Getting set up](#getting-set-up)
- [Environment variables](#environment-variables)
- [Development commands](#development-commands)
- [Before you open a pull request](#before-you-open-a-pull-request)
- [Branch naming](#branch-naming)
- [Commit messages](#commit-messages)
- [Architecture rules that matter](#architecture-rules-that-matter)
- [Tests](#tests)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [Releases](#releases)
- [License](#license)

## Code of Conduct

This project ships a [Code of Conduct](CODE_OF_CONDUCT.md). By taking part you agree to follow it. Report unacceptable behaviour to <souravshrestha@cbsdev.me>.

## Getting set up

You need Node.js 20 (the version CI runs) and a Supabase project.

```bash
git clone https://github.com/SouravShrestha/word-lock.git
cd word-lock
npm install
```

Then:

1. Create `apps/web/.env.local` with the variables below. It lives beside the Next app, not at the repo root — Next only loads `.env*` files from its own directory.
2. Apply the migrations in `supabase/migrations` in filename order against your Supabase project.
3. Start the dev server with `npm run dev` from the repo root and open http://localhost:3000.

This is an npm-workspaces monorepo driven by Turborepo. `npm install` at the root installs every workspace; there is no per-app install step.

```
apps/web       Next.js app, route handlers, the Cloudflare Worker
apps/mobile    Expo app (iOS + Android)
packages/*     Code shared by both clients
supabase/      Migrations — shared infrastructure, not owned by either app
```

Supabase dashboard setup (Google provider, magic links, the redirect allow-list) is documented in the [README](README.md#supabase-dashboard-setup). Auth will not work locally until `http://localhost:3000/auth/callback` is on the redirect allow-list.

## Environment variables

`apps/web/.env.local` is gitignored and never committed.

| Variable                        | Required | What it is                                                                                                  |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | yes      | Your Supabase project URL.                                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes      | Supabase anon key. Safe to expose to the browser.                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | yes      | Service-role key. **Server only** — it bypasses row-level security, so it must never reach a client bundle. |
| `NEXT_PUBLIC_SITE_URL`          | no       | Public origin of the deployment. Falls back to `http://localhost:3000`, which is correct for local work.    |
| `CRON_SECRET`                   | no       | Shared secret for the scheduled turn sweep. Only needed if you are exercising that path.                    |

`apps/mobile/.env.local` (also gitignored; copy `apps/mobile/.env.example`) holds the mobile app's own set — Expo only inlines variables prefixed `EXPO_PUBLIC_*`, which is a different prefix from the web's `NEXT_PUBLIC_*` on purpose (see `build-env.ts` in `@word-lock/core` for why `avatarUrl` checks both):

| Variable                        | Required        | What it is                                                                                                                                             |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | yes             | Same Supabase project as the web app.                                                                                                                  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes             | Same anon key as the web app.                                                                                                                          |
| `EXPO_PUBLIC_API_URL`           | yes from Task 8 | The web app's origin — the mobile client is not same-origin with the API the way the web app is, so `ApiConfig.baseUrl` has to be told where it lives. |

Never paste a real key into an issue, a pull request, or a test fixture.

## Development commands

All of these run from the repo root. The ones that fan out across workspaces go
through Turborepo, so they are cached — an unchanged package is not rebuilt.

```bash
npm run dev        # Web dev server on :3000
npm run build      # Build every workspace
npm run typecheck  # tsc --noEmit in every workspace
npm test           # vitest run in every workspace that has tests
npm run lint       # ESLint across the repo (includes Prettier as a rule)
npm run format     # Prettier --write .
npm run preview    # OpenNext build + wrangler dev, i.e. the Workers runtime
npm run deploy     # OpenNext build + wrangler deploy
npm run db:types   # Regenerate the Supabase types from the live schema
npm run check:boundaries   # Assert the shared packages stay dependency-free
```

Changing a colour is a two-step job, because the tokens are shared with the
mobile app and generated into both platforms' shapes:

```bash
# 1. edit packages/tokens/src/tokens.ts
# 2. regenerate and commit both the source and generated/
npm run generate --workspace @word-lock/tokens
```

`packages/tokens/src/tokens.test.ts` fails if `generated/` is stale, so a
forgotten step 2 fails CI rather than shipping a web/mobile mismatch. See
[packages/tokens/README.md](packages/tokens/README.md) — in particular the note
about the player colours being outside the sRGB gamut.

To scope a command to one workspace, either use npm's `--workspace` flag or
Turbo's `--filter`:

```bash
npm run dev --workspace @word-lock/web
npx turbo run test --filter @word-lock/core
```

`npm run preview` is worth knowing about: the production target is the Cloudflare Workers runtime, not Node, so a change touching server code can build fine under `next build` and still fail on Workers. If you touch a route handler or anything `.server.ts`, preview it.

## Before you open a pull request

CI runs these steps in this order, and any one of them failing fails the build:

```bash
npm ci
npm run typecheck
npm test
npm run build
cd apps/web && npx @opennextjs/cloudflare@latest build
npm run lint
```

The OpenNext step runs inside `apps/web` because that is where `wrangler.toml`
and `open-next.config.ts` live.

Run at least `npm run typecheck`, `npm test`, and `npm run lint` locally first. Two notes that save a round trip:

- **Prettier is an ESLint rule here**, so a formatting slip fails `npm run lint` _and_ `npm run build`. Run `npm run format` before pushing.
- `npm run format` runs Prettier across the whole repo. Keep your diff to the files your change actually touches, and don't sweep unrelated reformatting into the same pull request. `CHANGELOG.md` in particular is generated by release-please — leave it alone.

## Branch naming

Branch off `main`. The convention in this repo is a short prefix:

- `f/<short-name>` for features
- `fix/<short-name>` for bug fixes

Pushing any branch other than `main` runs the feature pipeline and deploys to the test environment, so keep work-in-progress commits off shared branches.

## Commit messages

Releases are automated by [release-please](https://github.com/googleapis/release-please), which reads the commit history, so **commit messages decide the version number and the changelog**. Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(leaderboard): show the viewer's rank above the list
fix(game): stop the turn clock ticking after a forfeit
docs: document the CRON_SECRET variable
chore(deps): bump wrangler to 3.90
refactor(engine): pull tile locking out of computeBoardState
test(stars): cover the draw case between unequal players
```

- `feat:` bumps the minor version, `fix:` the patch version.
- `feat!:` or a `BREAKING CHANGE:` footer bumps the major version. Don't use it casually.
- `docs:`, `chore:`, `refactor:`, `test:`, and `style:` don't trigger a release.

Scopes in use include `game`, `engine`, `auth`, `account`, `leaderboard`, `profile`, `dictionary`, and `ui`. Add a new one if none fits.

## Architecture rules that matter

`AGENTS.md` is the long form. These are the ones a pull request is most often sent back for:

- **Game logic is server-authoritative.** Every state mutation goes through a route handler in `src/app/api/game/*/route.ts`. Clients call the endpoint and learn the result over Supabase Realtime. A client never mutates game state directly.
- **Never import a `.server.ts` module into a client component.** Files like `src/lib/game/service.server.ts` and `src/integrations/supabase/client.server.ts` hold the service-role key and node-only APIs. Importing one from a `"use client"` file leaks secrets into the browser bundle.
- **Identity has exactly one seam.** `resolveCaller(request, body)` then `resolvePlayer(caller)` in `src/lib/game/identity.server.ts`. A logged-in caller is identified by their _verified_ `user_id` and the body's `sessionId` is ignored; only a guest falls back to it. Do not resolve a player from a raw session id anywhere else.
- **Client components call the API through `@word-lock/client`, never inline.** Import the `*Fn` functions from `"@word-lock/client"` (it used to be `src/lib/game/api.client.ts`; that file is gone). No inline `fetch` of a game endpoint in a component.
- **Keep route handlers thin.** Validate input with Zod (extend `callerSchema`), call `resolveCaller`, delegate to `service.server.ts`, return the updated state.
- **Stars have one writer.** `computeStarOutcome` in `src/lib/game/stars.server.ts`, with its compute/commit split. The deltas ride along in the same conditional `UPDATE` that flips a game to completed — that conditional update _is_ the idempotency guard against two requests finishing the same game.
- **Leagues are derived, never stored.** `leagueForStars` in `packages/core/src/account/leagues.ts` is the only way to get one.
- **Tailwind v4 for all styling.** No inline styles.
- **`"use client"`** is required for any component using hooks or browser APIs.
- **The tile grid is always 5×5**, indices 0–24, row-major.
- **Inline SVGs with a gradient or clip-path derive their ids from `useId()`.** Hardcoded ids break when the icon renders twice.

If your change contradicts something in `AGENTS.md`, that's allowed — but update `AGENTS.md` in the same pull request and say why in the description.

## Tests

Tests run on [Vitest](https://vitest.dev) and live next to the code as `*.test.ts`. The suite covers the pure logic where correctness is not obvious by reading: the star maths, leagues, streaks, the dictionary decoder, username validation, cookie parsing, and redirect safety.

```bash
npm test                        # once, as CI does
npx vitest --dir apps/web                 # watch mode for the web workspace
npx vitest run --dir apps/web/src/lib     # a subset
```

Add tests when you change pure logic, especially anything in `packages/core`. Security-adjacent helpers — `safeNextPath`, `validateUsername`, `findViewerId`, `getVerifiedUser` — should not change without a test for the case you're changing. `getVerifiedUser` (`src/integrations/supabase/client.route.test.ts`) is the identity check every game and account mutation trusts, so its tests mock `@supabase/ssr` at the module boundary and run every combination of "credential present / absent / valid / forged / expired" across both the bearer-token and cookie paths — extend that table rather than adding an isolated case elsewhere.

`service.server.ts` has no test infrastructure of its own beyond `deleteAccount` (`service.server.test.ts`), which mocks `getSupabaseAdmin` with a small in-memory fake of the query-builder methods that file's functions actually call (`.eq`/`.neq`/`.or`/`.in`/`.update`/`.delete`/`.maybeSingle`) rather than a general-purpose Supabase mock. If you add coverage for another function in this file, extend that fake's method set only as far as your test needs — an unmodelled chain call should throw, not silently match every row.

## Reporting bugs and requesting features

Open an issue using one of the [templates](https://github.com/SouravShrestha/word-lock/issues/new/choose). For a bug, the version from Settings → About and your browser are the two things that make a report answerable — the in-app "Help" link pre-fills both.

For anything security-sensitive, email <souravshrestha@cbsdev.me> instead of opening a public issue.

## Releases

You don't need to do anything for a release. Merging to `main` runs the pipeline, release-please opens or updates a release pull request, and merging that tags the version, writes `CHANGELOG.md`, and deploys to production. Don't hand-edit `package.json`'s version or `CHANGELOG.md`.

## License

Contributions are accepted under the [MIT License](LICENSE), the same license as the project.

Significant contributors are welcome to add themselves to [CREDITS.md](CREDITS.md) in their pull request.
