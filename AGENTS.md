# Word Lock — Agent Notes

Word Lock is a real-time 2-player word territory game built on **Next.js 15 App Router**, deployed to **Cloudflare Workers** via OpenNext.

## Key Architecture Decisions

- **Server-authoritative game logic**: All state mutations go through `src/app/api/game/*/route.ts` route handlers. Clients never mutate game state directly — they call these endpoints and receive updates via Supabase Realtime.
- **Server-only modules**: Files suffixed `.server.ts` (e.g. `src/lib/game/service.server.ts`, `src/lib/game/dictionary.server.ts`, `src/integrations/supabase/client.server.ts`) must **never** be imported in client components. They contain server-side secrets and node-only APIs.
- **Game engine**: Core tile-claiming, locking, and scoring logic lives in `src/lib/game/engine.ts`. This is shared between server route handlers.
- **Client API layer**: `src/lib/game/api.client.ts` is the only place client components should call API routes. Do not `fetch` game endpoints inline in components.
- **Realtime**: `src/integrations/supabase/client.ts` sets up the Supabase browser client used for Realtime subscriptions inside `GameClient.tsx`.
- **Session identity**: Player identity (name + session ID) is managed via `src/hooks/use-session.ts` using `localStorage`. There is no auth system.

## Project Structure

```
src/
├── app/
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
│   ├── game/[code]/       # Game page
│   │   └── _components/   # GameClient, WaitingLobby, ActionBar, ScoreBar, etc.
│   └── join/              # Join page
├── components/            # Shared UI components (HowToPlay, Tile, Header, etc.)
├── hooks/                 # use-session, use-mobile
├── lib/game/              # Game engine, service, dictionary (server-only where marked)
└── integrations/supabase/ # Supabase client (browser + server)
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
- Keep game route handlers thin: validate input with Zod, delegate to `service.server.ts`, return updated state.
- Tile grid is always 5×5 (25 tiles). Grid indices are 0–24, row-major order.
