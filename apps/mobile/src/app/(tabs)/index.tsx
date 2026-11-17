import { useAccount, useSession } from "@word-lock/client";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { NewGameSheet } from "@/components/NewGameSheet";
import { MedalPill, StreakPill } from "@/components/StatPills";
import { useTheme } from "@/theme/ThemeProvider";
import LOGO from "../../../assets/christmas/logo.png";

const INK = "#1A1110";

export default function HomeScreen() {
  const { ready } = useSession();
  const { data: account } = useAccount();
  const router = useRouter();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [newGameOpen, setNewGameOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  // Plain cream vanishes on the light page, so Join is a darker cream there.
  const join =
    resolvedTheme === "light"
      ? { fill: "#EBDFC0", lip: "#C2B085" }
      : { fill: "#FBF6EC", lip: "#D8CDB4" };

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-start justify-between px-8"
        style={{ paddingTop: Math.max(insets.top + 8, 20) }}
      >
        <View className="gap-6">
          <StreakPill />
          <MedalPill />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
          onPress={() => router.push("/profile")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Avatar avatar={account?.avatar} size={48} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center pb-44">
        <Link href="/" accessibilityLabel="Word Lock home" accessibilityRole="link">
          <Image source={LOGO} contentFit="contain" style={{ width: 195, height: 145 }} />
        </Link>

        <View className="mt-11 w-full max-w-sm flex-row gap-5 px-6">
          <ChunkyButton
            fill="#FFC400"
            lip="#FFA600"
            disabled={!ready}
            onPress={() => setNewGameOpen(true)}
          >
            New game
          </ChunkyButton>
          <ChunkyButton fill={join.fill} lip={join.lip} onPress={() => router.push("/join")}>
            Join
          </ChunkyButton>
        </View>
      </View>

      <View className="flex-row justify-end px-7 pb-5">
        <ChunkyButton fill="#FFC400" lip="#FFA600" size="sm" onPress={() => setRulesOpen(true)}>
          How to play?
        </ChunkyButton>
      </View>

      <HowToPlaySheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <NewGameSheet open={newGameOpen} onClose={() => setNewGameOpen(false)} />
    </View>
  );
}

/* Flat button with a hard lip in a darker shade of its own fill. */
function ChunkyButton({
  fill,
  lip,
  size = "md",
  disabled = false,
  onPress,
  children,
}: {
  fill: string;
  lip: string;
  size?: "md" | "sm";
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  const md = size === "md";
  const depth = md ? 5 : 3;
  const radius = md ? 20 : 18;
  const sink = pressed && !disabled ? depth : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flex: md ? 1 : undefined,
        paddingBottom: depth - sink,
        paddingTop: sink,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: depth,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: radius,
          backgroundColor: lip,
        }}
      />
      <View
        style={{
          height: md ? 48 : 40,
          paddingHorizontal: md ? 0 : 20,
          borderRadius: radius,
          backgroundColor: fill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          className={`font-display font-semibold ${md ? "text-[17px]" : "text-[14px]"}`}
          style={{ color: INK }}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
