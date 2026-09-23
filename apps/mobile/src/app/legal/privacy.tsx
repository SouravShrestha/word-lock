import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Linking, ScrollView, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton";
import { PRIVACY_UPDATED, SUPPORT_EMAIL } from "@/lib/app-meta";

export default function PrivacyScreen() {
  const router = useRouter();

  const goHome = () => router.replace("/");

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="px-5 pt-16">
        <BackButton label="Back to Word lock" onPress={goHome} />

        <View className="mt-8">
          <Text className="font-display text-3xl font-bold text-foreground">Privacy policy</Text>
          <Text className="mt-2 text-xs font-semibold text-mutedForeground">
            Last updated {PRIVACY_UPDATED}
          </Text>
        </View>

        <View className="mt-8 gap-8">
          <Section title="The short version">
            <P>
              Word lock is a two-player word game. To play you need an account, and the account is
              the only reason any personal data is stored: it is what your username, stars, streak
              and match history hang off so they follow you between devices.
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
                "Your device's time zone, reported by the device. It is used for one thing — deciding when your day rolls over so the streak advances correctly.",
                "A random session identifier kept on your device, so a game can be created before you sign in and attached to your account afterwards.",
              ]}
            />
            <P>
              No payment details are collected, because nothing is for sale. No contacts, photos,
              location or other device data are requested.
            </P>
          </Section>

          <Section title="Cookies and local storage">
            <P>
              Sign-in on this app uses a bearer token rather than a browser cookie, sent with every
              request so the server knows it is you. Your theme choice and session identifier are
              stored locally on your device, not sent to us as a cookie.
            </P>
            <P>
              Advertising cookies described in the next section apply to the web version of Word
              lock, not this app.
            </P>
          </Section>

          <Section title="Advertising">
            <P>
              The web version of Word lock shows ads to cover its running costs, served by Google
              using <A href="https://adsense.google.com/">Google AdSense</A>. This app does not
              currently show ads.
            </P>
            <P>
              You can opt out of personalised advertising in{" "}
              <A href="https://myadcenter.google.com/">Google Ad Settings</A>, or opt out of
              third-party vendors&apos; use of cookies for personalised advertising at{" "}
              <A href="https://www.aboutads.info/choices/">aboutads.info</A>.
            </P>
          </Section>

          <Section title="Who the data is shared with">
            <P>These are the only third parties involved in running the game:</P>
            <List
              items={[
                "Supabase — the database and authentication behind your account and games.",
                "Cloudflare — hosting and content delivery for the web app and its API.",
                "Google — advertising on the web version, and Google sign-in where offered.",
              ]}
            />
            <P>
              Each processes data only to provide its part of the service. Data may also be
              disclosed where the law requires it.
            </P>
          </Section>

          <Section title="How long it is kept">
            <P>
              Account and game data are kept while your account exists. Deleting your account (see
              below) removes your email, your username and your leaderboard entries. Games you
              already played stay in your opponents&apos; own match history, but without your
              username attached — the same as if you had never claimed one.
            </P>
          </Section>

          <Section title="Deleting your account">
            <P>
              Settings → Delete account removes your account from inside the app, immediately, with
              no need to contact us. Deleting: ends any game you were waiting to start, forfeits any
              game you were actively playing so your opponent gets a real result rather than a game
              that vanishes, frees your username for someone else to claim, and removes your sign-in
              so you cannot log back in as that account.
            </P>
            <P>
              What it does not do: it does not remove you from a game you already finished, and does
              not remove that game from the opponent you played it against — their match history is
              theirs too, and deleting your account does not delete data that belongs jointly to
              someone else.
            </P>
          </Section>

          <Section title="Your choices">
            <List
              items={[
                "Ask for a copy of what is stored about your account, or ask for it to be corrected.",
                "Delete your account yourself, at any time, from Settings — see above.",
                "Change or withdraw your advertising consent on the web version, or opt out of personalised ads entirely.",
                "Log out at any time from Settings. Logging out does not delete anything.",
              ]}
            />
            <P>
              For a copy or a correction, email{" "}
              <A href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</A> from the address on your
              account.
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
        </View>

        <View className="mt-12 gap-3">
          <Text onPress={goHome} className="text-sm font-bold text-foreground underline">
            Back to Word lock
          </Text>
          <Text
            onPress={() => router.replace("/how-to-play")}
            className="text-sm font-semibold text-mutedForeground underline"
          >
            How to play
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-display text-lg font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: ReactNode }) {
  return <Text className="font-sans text-sm leading-relaxed text-mutedForeground">{children}</Text>;
}

function List({ items }: { items: string[] }) {
  return (
    <View className="gap-2">
      {items.map((item) => (
        <View key={item} className="flex-row gap-2">
          <Text className="font-sans text-sm leading-relaxed text-mutedForeground">•</Text>
          <Text className="font-sans flex-1 text-sm leading-relaxed text-mutedForeground">
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Text onPress={() => Linking.openURL(href)} className="font-semibold text-foreground underline">
      {children}
    </Text>
  );
}
