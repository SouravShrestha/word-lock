import { Text } from "@/components/text";
import { useAuth } from "@word-lock/client";
import { GoogleIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Lip, lipPadding } from "@/components/lip";
import { OtpInput } from "@/components/OtpInput";
import { SheetTextInput, TopSheet } from "@/components/TopSheet";
import { useTheme } from "@/theme/ThemeProvider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
/** Supabase allows one code per email per minute. */
const RESEND_COOLDOWN_MS = 60_000;
/** How long the "Verified" capsule shows before the sheet goes. */
const SUCCESS_HOLD_MS = 1200;

type Phase = "choose" | "sending" | "code" | "verifying";

/** Flat auth-sheet button with the app's lip; border is drawn on the face so the lip sits under it. */
function AuthButton({
  face,
  depth,
  border,
  disabled,
  onPress,
  children,
}: {
  face: string;
  depth: string;
  border?: string;
  disabled: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className="overflow-hidden rounded-2xl"
    >
      {({ pressed }) => (
        <View
          style={{
            opacity: disabled ? 0.6 : 1,
            ...lipPadding(border ? 2 : 4, pressed && !disabled),
          }}
        >
          <Lip depth={depth} />
          <View
            className="h-14 flex-row items-center justify-center gap-3 rounded-2xl"
            style={{ backgroundColor: face, borderWidth: border ? 2 : 0, borderColor: border }}
          >
            {children}
          </View>
        </View>
      )}
    </Pressable>
  );
}

/**
 * `onHold` keeps this sheet mounted past sign-in (AuthGate would otherwise swap
 * it out the moment `isLoginRequired` flips) so the success capsule can play.
 */
export function AuthSheet({ onHold }: { onHold: (held: boolean) => void }) {
  const { canSignInWithGoogle, signInWithGoogle, signInWithEmail, verifyEmailCode } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

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
    if (!emailOpen) {
      setEmailOpen(true);
      return;
    }
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("That email doesn't look right.");
      return;
    }

    setError(null);
    setPhase("sending");
    try {
      await signInWithEmail(trimmed);
      const t = Date.now();
      setSentAt(t);
      setNow(t);
      setPhase("code");
    } catch {
      setError("Couldn't send that code. Wait a moment and try again.");
      setPhase("choose");
    }
  }, [email, emailOpen, signInWithEmail]);

  const onVerify = useCallback(
    async (value: string) => {
      setError(null);
      setPhase("verifying");
      onHold(true);
      try {
        await verifyEmailCode(email.trim(), value);
        setVerified(true);
        setTimeout(() => onHold(false), SUCCESS_HOLD_MS);
      } catch {
        setError("That code didn't work. Check it and try again.");
        setCode("");
        setPhase("code");
        onHold(false);
      }
    },
    [email, onHold, verifyEmailCode],
  );

  const onResend = useCallback(async () => {
    setError(null);
    try {
      await signInWithEmail(email.trim());
      const t = Date.now();
      setSentAt(t);
      setNow(t);
    } catch {
      setError("Couldn't send that code. Wait a moment and try again.");
    }
  }, [email, signInWithEmail]);

  const isCodePhase = phase === "code" || phase === "verifying";
  useEffect(() => {
    if (!isCodePhase) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isCodePhase]);
  const locked = phase === "verifying" || verified;
  const resendIn = Math.max(0, Math.ceil((sentAt + RESEND_COOLDOWN_MS - now) / 1000));

  const busy = googleBusy || phase === "sending" || phase === "verifying";
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <TopSheet
      open
      label={isCodePhase ? "Enter your code" : "Your friends are waiting"}
      dismissable={false}
      showHandle={false}
      scrollable={false}
    >
      {isCodePhase ? (
        <>
          <Text variant="sheetTitleSoft" className="pt-3 leading-tight text-center">
            Enter your code
          </Text>
          <Text variant="body" className="mt-2 text-center">
            We sent a 6-digit code to{" "}
            <Text variant="body" className="font-semibold text-foreground">
              {email.trim()}
            </Text>
          </Text>

          <OtpInput
            autoFocus
            length={CODE_LENGTH}
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError(null);
            }}
            onComplete={(value) => void onVerify(value)}
            error={!!error}
            verifying={phase === "verifying" && !verified}
            success={verified}
            className="mt-10"
          />

          {error && (
            <Text
              accessibilityRole="alert"
              variant="error"
              className="mt-3 text-center text-[13px] font-normal"
            >
              {error}
            </Text>
          )}

          <View className="mt-10 flex-row items-center justify-between px-1">
            <Pressable
              accessibilityRole="button"
              disabled={locked}
              onPress={() => {
                setPhase("choose");
                setCode("");
                setError(null);
              }}
            >
              <Text
                variant="hint"
                className={`text-sm text-foreground underline ${locked ? "opacity-50" : ""}`}
              >
                Use a different email
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={locked || resendIn > 0}
              onPress={() => void onResend()}
            >
              <Text
                variant="hint"
                className={`text-sm underline ${locked || resendIn > 0 ? "opacity-50" : "text-foreground"}`}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text variant="sheetTitleSoft" className="pt-3 leading-tight text-center">
            Your friends are waiting
          </Text>
          <View className="mt-8 gap-5">
            {emailOpen && error && (
              <Text
                accessibilityRole="alert"
                variant="error"
                className="-mb-3 ml-4 self-start text-left text-[13px] font-normal"
              >
                {error}
              </Text>
            )}
            {emailOpen && (
              <SheetTextInput
                autoFocus
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
                className="rounded-2xl bg-surface2 px-4 pb-0.5 text-[17px] h-14 font-medium tracking-wide text-foreground"
              />
            )}
            <AuthButton
              face={palette.grape}
              depth={palette.depthGrape}
              disabled={busy}
              onPress={onEmail}
            >
              <Text className="font-display text-[17px] font-medium text-white">
                {phase === "sending" ? "Sending…" : "Sign in with Email"}
              </Text>
            </AuthButton>

            {canSignInWithGoogle && (
              <AuthButton
                face={palette.background}
                depth={palette.hairline}
                border={palette.hairline}
                disabled={busy}
                onPress={onGoogle}
              >
                <GoogleIcon size={20} />
                <Text className="font-display text-[17px] font-medium text-foreground">
                  {googleBusy ? "Opening Google…" : "Continue with Google"}
                </Text>
              </AuthButton>
            )}
          </View>

          {error && !emailOpen && (
            <Text
              accessibilityRole="alert"
              variant="error"
              className="mt-3 text-[13px] font-normal"
            >
              {error}
            </Text>
          )}

          <Text variant="hint" className="mt-8 text-center text-sm">
            By continuing, you agree to our{" "}
            <Text
              variant="hint"
              accessibilityRole="link"
              onPress={() => router.push("/legal/privacy")}
              className="text-sm underline"
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </>
      )}
    </TopSheet>
  );
}
