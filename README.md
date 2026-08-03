# Word Lock

Word Lock is a real-time 2-player word territory game where players take turns spelling words on a shared 5×5 letter grid - claiming tiles, flipping opponents' letters, and racing to dominate the board.

## Getting Started

### Installation steps

1. Clone this repository: `git clone https://github.com/SouravShrestha/word-lock.git`
2. Navigate into the project directory: `cd word-lock`
3. Install the dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open your browser and go to `http://localhost:3000`

## How it works

1. **Take turns**: Two players share one 5×5 letter grid. On your turn, tap letters to spell a word of 3 letters or more.
2. **Claim tiles**: Every tile you use in a valid word becomes yours. Tiles your opponent owned flip to your colour.
3. **Lock tiles**: A tile of yours surrounded on all sides by your own tiles is locked - your opponent can no longer steal it.
4. **Win the board**: The game ends when every tile is claimed. Whoever owns the most tiles wins. Turns expire after 24 hours.

## Stack

- Next.js 15 (App Router, React 19)
- Supabase (Postgres + Realtime for live updates)
- Tailwind CSS v4
- TypeScript
- Zod for server-side validation
- Cloudflare Workers (via OpenNext)

## Development Commands

- Run Development Server: `npm run dev`
- Build for Production: `npm run build`
- Deploy: `npm run deploy`
- Run ESLint: `npm run lint`
- Format Code: `npm run format`

## Contributing

Contributions are welcome! Please fork the repo and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
