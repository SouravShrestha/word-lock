import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/BackButton";
import { SUPPORT_EMAIL } from "@/lib/app-meta";

export const metadata: Metadata = {
  title: "Terms of use - Word lock",
  description: "The terms for playing Word lock and using its leaderboard and accounts.",
  alternates: { canonical: "/legal/terms" },
};

const TERMS_UPDATED = "25 September 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <BackButton label="Back to Word lock" />
      </div>

      <header className="mt-8">
        <h1 className="font-display text-3xl font-bold">Terms of use</h1>
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          Last updated {TERMS_UPDATED}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        <Section title="Using Word lock">
          <P>
            Word lock is a two-player word game. You need an account to play, and you agree to give
            accurate information when creating one and to keep your sign-in details to yourself.
          </P>
        </Section>

        <Section title="Your conduct">
          <List
            items={[
              "Play fairly — no automation, scripting, or exploiting bugs to affect your stars, league or another player's game.",
              "Choose a username that isn't impersonating someone else, isn't offensive, and doesn't infringe anyone's rights.",
              "Don't attempt to disrupt the service for other players, including other accounts on a shared device.",
            ]}
          />
          <P>An account that breaks these terms may be suspended or removed.</P>
        </Section>

        <Section title="Accounts and data">
          <P>
            What is collected, why, and how to delete your account are covered in the{" "}
            <Link href="/legal/privacy" className="font-semibold text-foreground underline underline-offset-2">
              privacy policy
            </Link>
            , which is part of these terms.
          </P>
        </Section>

        <Section title="No warranty">
          <P>
            Word lock is provided as-is. Stars, leagues and match history are for the game itself —
            they carry no monetary value and aren&apos;t redeemable for anything.
          </P>
        </Section>

        <Section title="Changes">
          <P>
            These terms may change as the game does. Material changes will be noted in the app, and
            the date above will change with them.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            Questions about these terms go to{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-foreground underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </P>
        </Section>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        <Link href="/" className="text-sm font-bold underline underline-offset-4">
          Back to Word lock
        </Link>
        <Link
          href="/legal/privacy"
          className="text-sm font-semibold text-muted-foreground underline underline-offset-4"
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

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
