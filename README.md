# Word Lock

Word Lock is a real-time 2-player word territory game where players take turns spelling words on a shared 5×5 letter grid - claiming tiles, flipping opponents' letters, and racing to dominate the board.

## Getting Started

### Installation steps

1. Clone this repository: `git clone https://github.com/SouravShrestha/word-lock.git`
2. Navigate into the project directory: `cd word-lock`
3. Install the dependencies: `npm install` (an npm-workspaces monorepo — one install at the root covers every workspace)
4. Copy `.env.example` to `apps/web/.env.local` and fill in your Supabase values
5. Apply the migrations in `supabase/migrations` in filename order
6. Start the development server: `npm run dev`
7. Open your browser and go to `http://localhost:3000`

### Repository layout

```
apps/web       Next.js 15 app, route handlers, the Cloudflare Worker
apps/mobile    Expo app (iOS + Android)
packages/*     Code shared by both clients
supabase/      Migrations — shared infrastructure, not owned by either app
```

The mobile app runs from its own directory rather than the root, since
`expo start` needs its own long-lived process:

```bash
cd apps/mobile
cp .env.example .env.local   # fill in EXPO_PUBLIC_SUPABASE_URL etc.
npx expo start
```

## Accounts

Playing needs no account. A guest gets a session id in `localStorage` and can
create, join and finish games. Logging in adds a durable identity, and with it
the leaderboard, the daily streak and a place on the star ladder.

Logging in for the first time claims the guest player row for the account, so
games played beforehand carry over. Logging in on a second device merges that
device's guest games into the account. Logging out starts a fresh guest session
rather than restoring the previous one.

### Supabase dashboard setup

1. **Google provider** — Authentication → Providers → Google. Needs a client ID
   and secret from a Google Cloud OAuth consent screen, with Supabase's callback
   URL (`https://<project>.supabase.co/auth/v1/callback`) as an authorised
   redirect URI.
2. **Magic link** — Authentication → Providers → Email, with "Email OTP"
   enabled. Check the rate limits under Authentication → Rate Limits.
3. **Redirect allow-list** — Authentication → URL Configuration → Redirect URLs:

   ```
   http://localhost:3000/auth/callback
   https://test.wordlock.cbsdev.me/auth/callback
   https://wordlock.cbsdev.me/auth/callback
   ```

   These must match `NEXT_PUBLIC_SITE_URL` in each environment exactly.

The magic-link email template works with either `{{ .ConfirmationURL }}` or
`{{ .TokenHash }}`; `/auth/callback` handles both forms.

### Cloudflare setup

Set these as Worker secrets per environment (`wrangler secret put <NAME>`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`.

### Stars, leagues and streaks

- **Stars** are the ladder currency, applied when a game completes and **both**
  players have an account. New accounts start at 200 and the floor is 0. The
  delta depends on the matchup: beating someone well above you pays more than
  beating someone below you, and an even match is +20 / −14. That asymmetry is
  deliberate — the ladder is mildly inflationary so the higher leagues are
  reachable at all. Games involving a guest still count toward the win/loss
  record but are unranked, so nobody can farm stars off throwaway guest
  sessions.
- **Leagues** are five bands derived from the star count, never stored: Bronze
  0–399, Silver 400–899, Gold 900–1499, Platinum 1500–1999, Diamond 2000+.
  Promotion and demotion are both automatic, since the band is only ever a
  reading of the current total.
- **Streak** counts consecutive days on which a player took a turn, measured
  against their own local midnight. The browser reports its IANA timezone with
  each action. Auto-passes from the 24-hour turn sweep do not count.
- **Leaderboard** shows the top 100 in two scopes, your own league and global.
  Any account with a username is listed from its first visit; there is no
  minimum-games gate.

## How it works

1. **Take turns**: Two players share one 5×5 letter grid. On your turn, tap letters to spell a word of 3 letters or more.
2. **Claim tiles**: Every tile you use in a valid word becomes yours. Tiles your opponent owned flip to your colour.
3. **Lock tiles**: A tile of yours surrounded on all sides (non-diagonal) by your own tiles is locked - your opponent can no longer steal it.
4. **Win the board**: The game ends when every tile is claimed. Whoever owns the most tiles wins. Turns expire after 24 hours.

## Stack

- Next.js 15 (App Router, React 19)
- Supabase (Postgres, Realtime for live updates, Auth for accounts)
- Tailwind CSS v4
- TypeScript
- Zod for server-side validation
- Cloudflare Workers (via OpenNext)
- npm workspaces + Turborepo

## Development Commands

Run from the repo root.

- Run Development Server (web): `npm run dev`
- Build every workspace: `npm run build`
- Deploy the web app: `npm run deploy`
- Run ESLint: `npm run lint`
- Format Code: `npm run format`

## Contributing

Contributions are welcome! Please fork the repo and submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, and the architecture rules that matter, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the community guidelines that apply.

## Credits

See [CREDITS.md](CREDITS.md) for the data source, platform, and open-source libraries this project is built on.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
