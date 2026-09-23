import { useAuth } from "@word-lock/client";
import { GoogleIcon, MailIcon, StarIcon, StreakIcon, TrophyNavIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { SheetTextInput, TopSheet } from "@/components/TopSheet";
import { useTheme } from "@/theme/ThemeProvider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;

type Phase = "choose" | "sending" | "code" | "verifying";

function Perk({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-6 shrink-0 items-center justify-center">{icon}</View>
      <Text className="font-display font-medium text-[15px] tracking-wide text-mutedForeground">
        {label}
      </Text>
    </View>
  );
}

export function AuthSheet() {
  const { canSignInWithGoogle, signInWithGoogle, signInWithEmail, verifyEmailCode } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const onGoogle = useCallback(async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      // On success `isLoginRequired` flips and `AuthGate` swaps this sheet
      // out; nothing to navigate.
    } catch {
      setError("Couldn't reach Google. Try again, or use a code instead.");
    } finally {
      setGoogleBusy(false);
    }
  }, [signInWithGoogle]);

  const onEmail = useCallback(async () => {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("That email doesn't look right.");
      return;
    }

    setError(null);
    setPhase("sending");
    try {
      await signInWithEmail(trimmed);
      setPhase("code");
    } catch {
      setError("Couldn't send that code. Wait a moment and try again.");
      setPhase("choose");
    }
  }, [email, signInWithEmail]);

  const onVerify = useCallback(async () => {
    const trimmed = code.trim();
    if (trimmed.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code.`);
      return;
    }

    setError(null);
    setPhase("verifying");
    try {
      await verifyEmailCode(email.trim(), trimmed);
    } catch {
      setError("That code didn't work. Check it and try again.");
      setPhase("code");
    }
  }, [code, email, verifyEmailCode]);

  const busy = googleBusy || phase === "sending" || phase === "verifying";
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <TopSheet
      open
      label={phase === "code" || phase === "verifying" ? "Enter your code" : "Log in to play"}
      dismissable={false}
      showHandle={false}
      scrollable={false}
    >
      {phase === "code" || phase === "verifying" ? (
        <>
          <Text className="font-display text-xl leading-tight text-foreground">
            Enter your code
          </Text>
          <Text className="font-sans mt-6 text-[15px] leading-relaxed text-mutedForeground">
            We sent a 6-digit code to{" "}
            <Text className="font-bold text-foreground">{email.trim()}</Text>. Enter it below to
            finish logging in.
          </Text>

          <View className="mt-8 gap-2.5">
            <SheetTextInput
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError(null);
              }}
              placeholder="123456"
              placeholderTextColor={palette.mutedForeground}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              editable={!busy}
              accessibilityLabel="6-digit code"
              className="rounded-lg bg-surface2 px-4 pb-0.5 text-[17px] h-14 font-medium tracking-widest text-foreground mb-2"
            />

            <Button
              variant="sky"
              size="sheet"
              onPress={onVerify}
              disabled={busy}
              loading={phase === "verifying"}
            >
              Verify code
            </Button>

            <Pressable
              onPress={() => {
                setPhase("choose");
                setCode("");
                setError(null);
              }}
              disabled={phase === "verifying"}
            >
              <Text className="text-[14px] tracking-wide font-semibold text-mutedForeground mt-4 text-center">
                Use a different email
              </Text>
            </Pressable>
          </View>

          {error && (
            <Text
              accessibilityRole="alert"
              className="mt-3 text-sm font-semibold text-destructive text-center"
            >
              {error}
            </Text>
          )}
        </>
      ) : (
        <>
          <Text className="font-display text-xl leading-tight text-foreground">Log in to play</Text>
          <Text className="font-sans mt-5 text-[15px] leading-relaxed text-mutedForeground">
            You need an account so your gamesss, stars and streak follow you across devices.
          </Text>

          <View className="mt-6 gap-3.5">
            <Perk icon={<TrophyNavIcon size={20} />} label="Leaderboard ranking" />
            <Perk
              icon={
                <View style={{ marginLeft: 4 }}>
                  <StreakIcon size={18} />
                </View>
              }
              label="Daily streaks that stick"
            />
            <Perk
              icon={<StarIcon size={22} color={palette.mint} />}
              label="Stars, leagues and full match history"
            />
          </View>

          <View className="mt-8 gap-2.5">
            {canSignInWithGoogle && (
              <>
                <Button
                  variant="surface2"
                  size="sheet"
                  onPress={onGoogle}
                  disabled={busy}
                  loading={googleBusy}
                  icon={<GoogleIcon size={18} />}
                >
                  Continue with Google
                </Button>

                <View className="my-1 flex-row items-center gap-3">
                  <View className="h-px flex-1 bg-mutedForeground opacity-20" />
                  <Text className="font-display font-medium text-xs tracking-wide text-mutedForeground">
                    or
                  </Text>
                  <View className="h-px flex-1 bg-mutedForeground opacity-20" />
                </View>
              </>
            )}

            <SheetTextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={palette.mutedForeground}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              accessibilityLabel="Email address"
              className="rounded-lg bg-surface2 px-4 pb-0.5 text-[17px] h-12 font-medium tracking-wide text-foreground mb-2"
            />
            <Button
              variant="sky"
              size="sheet"
              onPress={onEmail}
              disabled={busy}
              loading={phase === "sending"}
              icon={<MailIcon size={17} color="#ffffff" />}
              loadingText="Sending"
            >
              Email me a code
            </Button>
          </View>

          {error && (
            <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-destructive">
              {error}
            </Text>
          )}

          <View className="mt-6 flex-row items-center justify-center gap-2">
            <Pressable onPress={() => router.push("/how-to-play")}>
              <Text className="text-sm font-semibold text-mutedForeground">How to play</Text>
            </Pressable>
            <Text className="font-sans text-xs text-mutedForeground opacity-50">·</Text>
            <Pressable onPress={() => router.push("/legal/privacy")}>
              <Text className="text-sm font-semibold text-mutedForeground">Privacy policy</Text>
            </Pressable>
          </View>
        </>
      )}
    </TopSheet>
  );
}
