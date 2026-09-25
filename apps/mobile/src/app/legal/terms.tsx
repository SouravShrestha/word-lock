import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton";
import { SUPPORT_EMAIL } from "@/lib/app-meta";

const TERMS_UPDATED = "25 September 2026";

export default function TermsScreen() {
  const router = useRouter();

  const goHome = () => router.replace("/");

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="px-5 pt-16">
        <BackButton label="Back to Word lock" onPress={goHome} />

        <View className="mt-8">
          <Text className="font-display text-3xl font-bold text-foreground">Terms of use</Text>
          <Text className="mt-2 text-xs font-semibold text-mutedForeground">
            Last updated {TERMS_UPDATED}
          </Text>
        </View>

        <View className="mt-8 gap-8">
          <Section title="Using Word lock">
            <P>
              Word lock is a two-player word game. You need an account to play, and you agree to
              give accurate information when creating one and to keep your sign-in details to
              yourself.
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
              What is collected, why, and how to delete your account are covered in the privacy
              policy, which is part of these terms.
            </P>
          </Section>

          <Section title="No warranty">
            <P>
              Word lock is provided as-is. Stars, leagues and match history are for the game itself
              — they carry no monetary value and aren&apos;t redeemable for anything.
            </P>
          </Section>

          <Section title="Changes">
            <P>
              These terms may change as the game does. Material changes will be noted in the app,
              and the date above will change with them.
            </P>
          </Section>

          <Section title="Contact">
            <P>Questions about these terms go to {SUPPORT_EMAIL}.</P>
          </Section>
        </View>

        <View className="mt-12 gap-3">
          <Text onPress={goHome} className="text-sm font-bold text-foreground underline">
            Back to Word lock
          </Text>
          <Text
            onPress={() => router.replace("/legal/privacy")}
            className="text-sm font-semibold text-mutedForeground underline"
          >
            Privacy policy
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
