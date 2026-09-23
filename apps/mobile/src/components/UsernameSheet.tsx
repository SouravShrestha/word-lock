import { checkUsernameFn, setUsernameFn, useAuth, useSession } from "@word-lock/client";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_ERROR_COPY,
  normalizeUsername,
  validateUsername,
} from "@word-lock/core/account";
import { CheckIcon, SmileyFaceIcon } from "@word-lock/icons/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors } from "@word-lock/tokens/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { SheetTextInput, TopSheet } from "@/components/TopSheet";
import { useTheme } from "@/theme/ThemeProvider";

const CHECK_DEBOUNCE_MS = 400;

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "free" }
  | { state: "taken"; reason: string };

export function UsernameSheet() {
  const { signOut } = useAuth();
  const { sessionId } = useSession();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const [value, setValue] = useState("");
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeUsername(value), [value]);
  const formatError = normalized.length > 0 ? validateUsername(normalized) : null;

  useEffect(() => {
    if (normalized.length === 0 || formatError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets local status ahead of the debounced availability check below, not derivable at render time
      setAvailability({ state: "idle" });
      return;
    }

    setAvailability({ state: "checking" });
    let active = true;
    const timer = setTimeout(() => {
      checkUsernameFn(normalized)
        .then((result) => {
          if (!active) return;
          setAvailability(
            result.available
              ? { state: "free" }
              : { state: "taken", reason: result.reason ?? "That one's taken." },
          );
        })
        .catch(() => {
          if (active) setAvailability({ state: "idle" });
        });
    }, CHECK_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [normalized, formatError]);

  const mutation = useMutation({
    mutationFn: () => setUsernameFn({ sessionId: sessionId!, username: normalized }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const submit = useCallback(() => {
    if (formatError || !sessionId || mutation.isPending) return;
    mutation.mutate();
  }, [formatError, sessionId, mutation]);

  const goBack = useCallback(async () => {
    if (leaving || mutation.isPending) return;
    setLeaveError(null);
    setLeaving(true);
    try {
      await signOut();
      setLeaving(false);
    } catch {
      setLeaveError("Couldn't log out. Try again.");
      setLeaving(false);
    }
  }, [leaving, mutation.isPending, signOut]);

  const canSubmit =
    !formatError && normalized.length >= MIN_USERNAME_LENGTH && !mutation.isPending && !leaving;

  return (
    <TopSheet
      open
      dismissable={false}
      showHandle={false}
      label="Pick your username"
      scrollable={false}
    >
      <View className="items-center gap-2">
        <SmileyFaceIcon size={56} />
        <Text className="font-display mt-5 text-lg leading-tight text-foreground">
          What shall we call you?
        </Text>
        <Text className="font-sans text-sm leading-relaxed text-mutedForeground font-normal">
          This is how players see you
        </Text>
      </View>

      <Text className="font-sans mt-4 text-sm leading-relaxed text-mutedForeground text-center">
        You can only set this once, so choose carefully.
      </Text>

      <View className="mt-2 gap-2.5">
        <SheetTextInput
          value={value}
          onChangeText={setValue}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          maxLength={MAX_USERNAME_LENGTH}
          placeholder="@wordfox"
          placeholderTextColor={palette.mutedForeground}
          accessibilityLabel="Username"
          className="rounded-lg bg-surface2 px-4 pb-0.5 text-[15px] h-12 font-medium text-foreground"
        />

        <View accessibilityRole="text" className="min-h-5 flex-row items-center justify-end gap-1">
          {formatError ? (
            <Text className="text-right text-xs font-normal text-destructive">
              {USERNAME_ERROR_COPY[formatError]}
            </Text>
          ) : availability.state === "taken" ? (
            <Text className="text-right text-xs font-normal text-destructive">
              {availability.reason}
            </Text>
          ) : availability.state === "checking" ? (
            <Text className="text-right text-xs font-normal text-mutedForeground">
              Checking availability
            </Text>
          ) : availability.state === "free" ? (
            <>
              <CheckIcon size={14} color={palette.mint} />
              <Text className="text-right text-xs font-normal text-mint">
                {normalized} is available
              </Text>
            </>
          ) : (
            <Text className="text-right text-xs font-normal text-mutedForeground">
              {MIN_USERNAME_LENGTH}–{MAX_USERNAME_LENGTH} characters. Letters, numbers and
              underscores.
            </Text>
          )}
        </View>

        <Button
          variant="sky"
          size="sheet"
          onPress={submit}
          disabled={!canSubmit}
          loading={mutation.isPending}
        >
          Claim username
        </Button>

        {mutation.error && (
          <Text accessibilityRole="alert" className="text-sm font-semibold text-destructive">
            {mutation.error.message}
          </Text>
        )}

        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          <Text className="text-center text-sm font-semibold text-mutedForeground">
            Wrong account?
          </Text>
          <Pressable onPress={goBack} disabled={leaving || mutation.isPending}>
            <Text className="text-sm font-bold text-foreground underline">
              {leaving ? "Logging out" : "Back to log in"}
            </Text>
          </Pressable>
        </View>

        {leaveError && (
          <Text
            accessibilityRole="alert"
            className="text-center text-sm font-semibold text-destructive"
          >
            {leaveError}
          </Text>
        )}
      </View>
    </TopSheet>
  );
}
