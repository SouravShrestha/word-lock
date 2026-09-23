import { LEAGUES } from "@word-lock/core/account";
import {
  BASE_STARS,
  MIN_STARS,
  MIN_WORD_LENGTH,
  RULES,
  TURN_LIMIT_HOURS,
} from "@word-lock/core/game";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { RuleNumber } from "@/components/RuleNumber";

export default function HowToPlayScreen() {
  const router = useRouter();

  const goHome = () => router.replace("/");

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="px-5 pt-16">
        <BackButton label="Back to Word lock" onPress={goHome} />

        <View className="mt-8">
          <Text className="font-display text-3xl font-bold text-foreground">
            How to play Word lock
          </Text>
          <P className="mt-3">
            Word lock is a two-player word game about territory rather than speed. You and one
            opponent share a single 5×5 grid of letters, and every word you play takes tiles off
            each other until the board runs out of moves. Games are played a turn at a time, so
            neither of you has to be online at once.
          </P>
        </View>

        <View className="mt-10 gap-10">
          <Section title="The rules in four steps">
            <View className="gap-4">
              {RULES.map((rule, i) => (
                <View key={rule.title} className="flex-row gap-3">
                  <RuleNumber>{i + 1}</RuleNumber>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{rule.title}</Text>
                    <P className="mt-1">{rule.body}</P>
                  </View>
                </View>
              ))}
            </View>
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
              letter distribution, at least seven vowels, no letter more than four times, and
              checked to be sure at least fifty real words can be spelled from it before the game
              starts.
            </P>
          </Section>

          <Section title="Claiming and stealing">
            <P>
              Every tile you use becomes yours, including tiles your opponent already owned — those
              flip to your colour. This is the heart of the game: a long word is not automatically a
              good move, because the tiles you take are tiles your opponent can take straight back
              on their turn.
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
              word can lock several tiles at once. Locked territory is the only permanent score in
              the game, so the winning approach is usually to build a solid block in a corner rather
              than to grab scattered tiles across the grid.
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
              you, so a game can never stall forever waiting on someone. You can also forfeit from
              the in-game menu, which hands the win to your opponent.
            </P>
          </Section>

          <Section title="Stars, leagues and streaks">
            <P>
              Every account starts at {BASE_STARS} stars. Win a ranked game and you gain stars, lose
              one and you drop some, with the size of the swing depending on how strong your
              opponent was — a win against someone well above you is worth more than a win against
              someone below you. Stars never fall below {MIN_STARS}, and a game is only ranked when
              both players are logged in.
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
              Leagues are worked out from your stars rather than stored, so you move between them
              the moment your total crosses a boundary. Separately, a streak counts the days in a
              row you have finished at least one game, measured against your own device&apos;s time
              zone.
            </P>
          </Section>

          <Section title="Starting a game">
            <P>
              Games are invite-only. Create one and you get a short room code to send to whoever you
              want to play; they enter it on the join screen and the game begins. You can have up to
              five games running at once, and each one appears on your home screen with whose turn
              it is and how long is left.
            </P>
            <P>
              Playing needs a free account, which is what your username, stars, streak and match
              history are attached to. You can sign in with Google or with a link sent to your
              email.
            </P>
          </Section>
        </View>

        <View className="mt-12 gap-4">
          <Button variant="sky" onPress={goHome}>
            Play Word lock
          </Button>
          <Text
            onPress={() => router.replace("/legal/privacy")}
            className="mt-2 text-center text-sm font-semibold text-mutedForeground underline"
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

function P({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`font-sans text-sm leading-relaxed text-mutedForeground ${className ?? ""}`}>
      {children}
    </Text>
  );
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
