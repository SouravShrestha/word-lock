import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/BackButton";
import { LEAGUES } from "@/lib/account/leagues";
import { MIN_WORD_LENGTH, RULES, TURN_LIMIT_HOURS } from "@/lib/game/rules";
import { BASE_STARS, MIN_STARS } from "@/lib/game/stars";

export const metadata: Metadata = {
  title: "How to play Word lock - rules, locking and leagues",
  description:
    "The full rules of Word lock: spell words from a shared 5x5 grid, claim tiles, surround your own tiles to lock them, and win the board. Plus stars, leagues and streaks.",
  alternates: { canonical: "/how-to-play" },
  openGraph: {
    title: "How to play Word lock",
    description: "Claim letters, lock tiles, win the grid. The full rules.",
    url: "/how-to-play",
  },
};

/**
 * The long-form rules, as a public page.
 *
 * Two jobs. It is the guide a player can send to the friend they are trying to
 * teach, and it is the only substantial page a visitor without an account can
 * read — the rest of the app is behind the login wall, which leaves a crawler
 * looking at a wordmark and two buttons. `lib/auth/public-routes.ts` is what
 * keeps the wall off this route.
 *
 * The four headline rules come from `lib/game/rules.ts`, shared with
 * `HowToPlaySheet`. Everything else here is detail that does not fit in a sheet:
 * what makes a word legal, how a lock actually happens, and what the ladder is.
 * Where this page states a number it is imported, not typed out, so it cannot
 * drift from the engine.
 */
export default function HowToPlayPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <BackButton label="Back to Word lock" />
        <span className="eyebrow text-[0.8rem] text-muted-foreground">Word lock</span>
      </div>

      <header className="mt-8">
        <h1 className="font-display text-3xl font-bold">How to play Word lock</h1>
        <P className="mt-3">
          Word lock is a two-player word game about territory rather than speed. You and one
          opponent share a single 5×5 grid of letters, and every word you play takes tiles off each
          other until the board runs out of moves. Games are played a turn at a time, so neither of
          you has to be online at once.
        </P>
      </header>

      <div className="mt-10 flex flex-col gap-10">
        <Section title="The rules in four steps">
          <ol className="flex flex-col gap-4">
            {RULES.map((rule, i) => (
              <li key={rule.title} className="flex gap-3">
                {/* Same numbered chip as the in-app sheet, minus the press
                    behaviour — it is a label, not a control. */}
                <span className="soft-btn btn-sun mt-0.5 h-7 w-7 shrink-0 text-xs">{i + 1}</span>
                <div>
                  <h3 className="text-sm font-bold">{rule.title}</h3>
                  <P className="mt-1">{rule.body}</P>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="What counts as a word">
          <P>A move is accepted when all of this is true:</P>
          <List
            items={[
              `It is at least ${MIN_WORD_LENGTH} letters long.`,
              "It is in the dictionary. Word lock checks against a list of roughly 370,000 English words, so obscure but real words are usually fine and names are not.",
              "Each tile is used at most once in the word. Tiles do not have to touch each other — you can spell from anywhere on the grid.",
              "The word has not already been played in this game, by either player.",
            ]}
          />
          <P>
            The grid itself is not random letters thrown down: it is generated with a weighted
            letter distribution, at least seven vowels, no letter more than four times, and checked
            to be sure at least fifty real words can be spelled from it before the game starts.
          </P>
        </Section>

        <Section title="Claiming and stealing">
          <P>
            Every tile you use becomes yours, including tiles your opponent already owned — those
            flip to your colour. This is the heart of the game: a long word is not automatically a
            good move, because the tiles you take are tiles your opponent can take straight back on
            their turn.
          </P>
          <P>
            The exception is a locked tile. Locked tiles cannot be used to spell a word by the
            player who does not own them, and they never change hands again.
          </P>
        </Section>

        <Section title="How locking works">
          <P>
            A tile locks the moment every neighbour it has — above, below, left and right, never
            diagonally — is owned by the same player who owns the tile. Edge and corner tiles have
            fewer neighbours, which makes them the cheapest places on the board to lock something
            down.
          </P>
          <P>
            Locking is checked automatically after each word, and it can cascade: one well-placed
            word can lock several tiles at once. Locked territory is the only permanent score in the
            game, so the winning approach is usually to build a solid block in a corner rather than
            to grab scattered tiles across the grid.
          </P>
        </Section>

        <Section title="How a game ends">
          <P>
            The game ends when no tile on the board can ever be locked again — in practice, when
            everything is claimed and settled — or when both players pass in a row. Whoever owns
            more tiles wins, and an even split is a draw.
          </P>
          <P>
            Each turn lasts {TURN_LIMIT_HOURS} hours. Run out of time and your turn is passed for
            you, so a game can never stall forever waiting on someone. You can also forfeit from the
            in-game menu, which hands the win to your opponent.
          </P>
        </Section>

        <Section title="Stars, leagues and streaks">
          <P>
            Every account starts at {BASE_STARS} stars. Win a ranked game and you gain stars, lose
            one and you drop some, with the size of the swing depending on how strong your opponent
            was — a win against someone well above you is worth more than a win against someone
            below you. Stars never fall below {MIN_STARS}, and a game is only ranked when both
            players are logged in.
          </P>
          <P>Your star total puts you in a league:</P>
          <List
            items={LEAGUES.map((tier) =>
              tier.maxStars === null
                ? `${tier.name} — ${tier.minStars} stars and up`
                : `${tier.name} — ${tier.minStars} to ${tier.maxStars} stars`,
            )}
          />
          <P>
            Leagues are worked out from your stars rather than stored, so you move between them the
            moment your total crosses a boundary. Separately, a streak counts the days in a row you
            have finished at least one game, measured against your own device&apos;s time zone.
          </P>
        </Section>

        <Section title="Starting a game">
          <P>
            Games are invite-only. Create one and you get a short room code to send to whoever you
            want to play; they enter it on the join screen and the game begins. You can have up to
            five games running at once, and each one appears on your home screen with whose turn it
            is and how long is left.
          </P>
          <P>
            Playing needs a free account, which is what your username, stars, streak and match
            history are attached to. You can sign in with Google or with a link sent to your email.
          </P>
        </Section>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        <Link href="/" className="soft-btn btn-sky w-full py-3.5 text-center text-base">
          Play Word lock
        </Link>
        <Link
          href="/legal/privacy"
          className="text-center text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          Privacy policy
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm leading-relaxed text-muted-foreground ${className ?? ""}`}>{children}</p>
  );
}

function List({ items }: { items: string[] }) {
  return (
    /* Block, not flex: a flex container overrides the list-item display and the
       bullets disappear. */
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
