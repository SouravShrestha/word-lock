import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/BackButton";
import { PRIVACY_UPDATED, SUPPORT_EMAIL } from "@/lib/app-meta";

export const metadata: Metadata = {
  title: "Privacy policy - Word lock",
  description:
    "What Word lock stores about you, the cookies it uses, and how advertising on the site works.",
  alternates: { canonical: "/legal/privacy" },
};

/**
 * The privacy policy.
 *
 * A real page rather than a sheet, for two reasons. It has to be linkable and
 * crawlable — Google AdSense will not approve a site whose policy lives behind a
 * login or inside a modal — and it is long enough that a player needs to be able
 * to scroll, share and come back to it.
 *
 * `lib/auth/public-routes.ts` is what keeps the login wall off this route. The
 * page itself reads nothing about the caller, so it renders statically for
 * everyone, logged in or not.
 *
 * Plain headings and paragraphs on purpose: this is the one screen in the app
 * where being skimmable and quotable beats being styled.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <BackButton label="Back to Word lock" />
      </div>

      <header className="mt-8">
        <h1 className="font-display text-3xl font-bold">Privacy policy</h1>
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          Last updated {PRIVACY_UPDATED}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        <Section title="The short version">
          <P>
            Word lock is a two-player word game. To play you need an account, and the account is
            only reason any personal data is stored: it is what your username, stars, streak and
            match history hang off so they follow you between devices.
          </P>
          <P>
            Nothing here is sold, and nothing is shared with anyone beyond the service providers
            listed below that are needed to run the game and show ads.
          </P>
        </Section>

        <Section title="What is collected">
          <P>When you log in and play, the following is stored:</P>
          <List
            items={[
              "Your email address, handled by our authentication provider so you can sign in with Google or an email link. It is never shown to other players.",
              "Your username, which is public: opponents, the leaderboard and match history all show it.",
              "Your chosen avatar, which is a reference to one of our own images, not an uploaded photo.",
              "Your game data: games played, words submitted, scores, stars, league, daily streak and results.",
              "Your device's time zone, reported by the browser. It is used for one thing — deciding when your day rolls over so the streak advances correctly.",
              "A random session identifier kept in your browser's local storage, so a game can be created before you sign in and attached to your account afterwards.",
            ]}
          />
          <P>
            No payment details are collected, because nothing is for sale. No contacts, photos,
            location or other device data are requested.
          </P>
        </Section>

        <Section title="Cookies and local storage">
          <P>
            Sign-in cookies are set by our authentication provider and are strictly necessary: they
            are how the site knows the request is yours, and without them you cannot stay logged
            Your theme choice and session identifier are stored locally in your browser, not in a
            cookie sent to us.
          </P>
          <P>
            Advertising cookies are separate and are described in the next section. You can clear
            block cookies in your browser at any time; blocking the sign-in cookies will log you
            out.
          </P>
        </Section>

        <Section title="Advertising">
          <P>
            Word lock shows ads to cover its running costs. Ads are served by Google, using{" "}
            <A href="https://adsense.google.com/">Google AdSense</A>.
          </P>
          <P>
            Third-party vendors, including Google, use cookies and similar identifiers to serve ads
            based on your previous visits to this and other websites, to limit how often you see
            same ad, and to measure whether an ad worked. Google&apos;s use of advertising cookies
            cookies lets it and its partners serve ads to you based on your visit to this site
            and/or other sites on the internet.
          </P>
          <P>
            You can opt out of personalised advertising in{" "}
            <A href="https://myadcenter.google.com/">Google Ad Settings</A>, or opt out of
            third-party vendors&apos; use of cookies for personalised advertising at{" "}
            <A href="https://www.aboutads.info/choices/">aboutads.info</A>. How Google handles data
            from sites that use its services is described in{" "}
            <A href="https://policies.google.com/technologies/partner-sites">
              Google&apos;s privacy and terms
            </A>
            .
          </P>
          <P>
            If you are in the European Economic Area, the UK or Switzerland, you will be asked for
            consent before personalised ads are shown, and you can change or withdraw that choice
            any time through the same consent prompt.
          </P>
        </Section>

        <Section title="Who the data is shared with">
          <P>These are the only third parties involved in running the game:</P>
          <List
            items={[
              "Supabase — the database and authentication behind your account and games.",
              "Cloudflare — hosting and content delivery for the site itself.",
              "Google — advertising, and Google sign-in if that is how you log in.",
            ]}
          />
          <P>
            Each processes data only to provide its part of the service. Data may also be disclosed
            where the law requires it.
          </P>
        </Section>

        <Section title="How long it is kept">
          <P>
            Account and game data are kept while your account exists. Ask us to delete the account
            and the account, its games and its leaderboard entries go with it. Finished games you
            played against someone else may remain in that player&apos;s history without your
            username attached.
          </P>
        </Section>

        <Section title="Your choices">
          <List
            items={[
              "Ask for a copy of what is stored about your account, or ask for it to be corrected.",
              "Ask for your account and its data to be deleted.",
              "Change or withdraw your advertising consent, or opt out of personalised ads entirely.",
              "Log out at any time from Settings. Logging out does not delete anything.",
            ]}
          />
          <P>
            For any of these, email <A href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</A> from
            address on your account.
          </P>
        </Section>

        <Section title="Children">
          <P>
            Word lock is not directed at children under 13, and accounts are not knowingly created
            for them. If you believe a child has an account, email us and it will be removed.
          </P>
        </Section>

        <Section title="Changes">
          <P>
            If this policy changes, the date at the top changes with it. Material changes will be
            noted in the app.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            Questions about any of this go to{" "}
            <A href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</A>.
          </P>
        </Section>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        <Link href="/" className="text-sm font-bold underline underline-offset-4">
          Back to Word lock
        </Link>
        <Link
          href="/how-to-play"
          className="text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          How to play
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
    /* Block, not flex: a flex container overrides the list-item display and the
       bullets disappear. */
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** External links here always leave the app, so they all open in a new tab. */
function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-semibold text-foreground underline underline-offset-2"
    >
      {children}
    </a>
  );
}
