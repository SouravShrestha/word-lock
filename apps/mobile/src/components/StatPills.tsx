import { useAccount } from "@word-lock/client";
import { browserTimezone } from "@word-lock/core/account";
import { currentStreak, localDate } from "@word-lock/core/game";
import { Image, type ImageProps } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import STREAK_IMAGE from "../../assets/christmas/streak.png";
import TROPHY_IMAGE from "../../assets/christmas/trophy.png";
import { StreakSheet } from "@/components/StreakSheet";

/*
 * Duolingo-style badge from Figma "Christmas - Light": a 64px card with a
 * label band and a hard 4px base, the mascot breaking out of the top edge.
 */
function Badge({
  image,
  imageBox,
  face,
  band,
  base,
  label,
}: {
  image: ImageProps["source"];
  imageBox: { left: number; top: number; width: number; height: number };
  face: [string, string];
  band: string;
  base: string;
  label: string;
}) {
  /* The 64×84 art scaled to 85%: the outer box is sized to the scaled result so layout shrinks with it. */
  return (
    <View style={{ width: 54, height: 71 }}>
      <View
        style={{ width: 64, height: 84, transform: [{ scale: 0.85 }], transformOrigin: "top left" }}
      >
        <View
          style={{
            position: "absolute",
            top: 16,
            width: 64,
            height: 68,
            borderRadius: 16,
            backgroundColor: base,
          }}
        >
          <View style={{ height: 64, borderRadius: 16, overflow: "hidden" }}>
            <LinearGradient colors={face} style={{ flex: 1 }} />
            <View
              style={{
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: band,
              }}
            >
              <Text className="font-display font-bold text-[13px] text-white">{label}</Text>
            </View>
          </View>
        </View>
        <Image source={image} contentFit="contain" style={{ position: "absolute", ...imageBox }} />
      </View>
    </View>
  );
}

export function StreakPill() {
  const { data } = useAccount();
  const [open, setOpen] = useState(false);

  const stored = data?.playStreak ?? 0;
  const lastPlayedOn = data?.lastPlayedOn ?? null;
  const lastFreezeOn = data?.lastFreezeOn ?? null;
  const today = localDate(new Date(), browserTimezone());
  const value = currentStreak(
    { play_streak: stored, last_played_on: lastPlayedOn, last_freeze_on: lastFreezeOn },
    today,
  );
  const label = String(value).padStart(2, "0");

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${value} day streak`}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Badge
          image={STREAK_IMAGE}
          imageBox={{ left: 10, top: -2, width: 44, height: 51 }}
          face={["#FF7A00", "#FF3A1A"]}
          band="#E40049"
          base="#9E0033"
          label={label}
        />
      </Pressable>

      <StreakSheet
        open={open}
        onClose={() => setOpen(false)}
        playStreak={stored}
        lastPlayedOn={lastPlayedOn}
        lastFreezeOn={lastFreezeOn}
      />
    </>
  );
}

export function MedalPill() {
  const { data } = useAccount();
  const value = data?.stars ?? 0;
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value} medals, match history`}
      onPress={() => router.push("/history")}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Badge
        image={TROPHY_IMAGE}
        imageBox={{ left: 6, top: -3, width: 52, height: 53 }}
        face={["#8B1EFF", "#6A10CC"]}
        band="#4B008B"
        base="#2E0057"
        label={String(value)}
      />
    </Pressable>
  );
}
