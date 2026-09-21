# Credits

Word Lock is built and maintained by [Sourav Shrestha](https://www.cbsdev.me/).

## Data

- **Word list** — the 370k-word dictionary in [`data/words_alpha.txt`](data/words_alpha.txt) comes from [dwyl/english-words](https://github.com/dwyl/english-words).

## Platform and infrastructure

- **[Next.js](https://nextjs.org/)** — application framework (App Router)
- **[Supabase](https://supabase.com/)** — Postgres database, Realtime, and Auth
- **[Cloudflare Workers](https://workers.cloudflare.com/)** — deployment target, via **[OpenNext](https://opennext.js.org/cloudflare)**

## Key open-source dependencies

- **[React](https://react.dev/)** / **React DOM** — UI library
- **[TypeScript](https://www.typescriptlang.org/)** — static typing
- **[Tailwind CSS](https://tailwindcss.com/)** — styling
- **[Zod](https://zod.dev/)** — schema validation
- **[TanStack Query](https://tanstack.com/query)** — client-side data fetching and caching
- **[Vaul](https://vaul.emilkowal.ski/)** — bottom sheet primitives
- **[Recharts](https://recharts.org/)** — charts
- **[Sonner](https://sonner.emilkowal.ski/)** — toast notifications
- **[nextjs-toploader](https://github.com/TheSGJ/nextjs-toploader)** / **[nprogress](https://github.com/rstacruz/nprogress)** — navigation progress bar
- **[next-themes](https://github.com/pacocoursey/next-themes)** — theme handling
- **[clsx](https://github.com/lukeed/clsx)** / **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** — class name composition

See [`package.json`](package.json) for the full, versioned dependency list and their respective licenses.

## Tooling

- **[ESLint](https://eslint.org/)** / **[Prettier](https://prettier.io/)** — linting and formatting
- **[Vitest](https://vitest.dev/)** — testing
- **[release-please](https://github.com/googleapis/release-please)** — automated versioning and changelog generation

## Want to be credited?

If you've contributed to Word Lock and would like to be listed here, open a pull request adding yourself under a "Contributors" section, or mention it in your PR description and it'll be added on merge.

---

Word Lock is released under the [MIT License](LICENSE).
