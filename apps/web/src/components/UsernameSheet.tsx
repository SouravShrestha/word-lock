"use client";
import { useAuth, useAccount, useSession, checkUsernameFn, setUsernameFn } from "@word-lock/client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { BottomSheet } from "@/components/BottomSheet";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { LeftArrowIcon } from "@/components/icons/LeftArrowIcon";
import { SmileyFaceIcon } from "@/components/icons/SmileyFaceIcon";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_ERROR_COPY,
  normalizeUsername,
  validateUsername,
} from "@word-lock/core/account";

const CHECK_DEBOUNCE_MS = 400;

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "free" }
  | { state: "taken"; reason: string };

export function UsernameSheet() {
  const { isLoggedIn, ready: authReady, signOut } = useAuth();
  const { sessionId } = useSession();
  const { data: account, isLoading } = useAccount();
  const queryClient = useQueryClient();

  const [value, setValue] = useState("");
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeUsername(value), [value]);
  const formatError = normalized.length > 0 ? validateUsername(normalized) : null;

  const open = authReady && isLoggedIn && !isLoading && account?.username === null;

  useEffect(() => {
    if (!open) return;
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
  }, [normalized, formatError, open]);

  const mutation = useMutation({
    mutationFn: () => setUsernameFn({ sessionId: sessionId!, username: normalized }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (formatError || !sessionId || mutation.isPending) return;
      mutation.mutate();
    },
    [formatError, sessionId, mutation],
  );

  const goBack = useCallback(async () => {
    if (leaving || mutation.isPending) return;
    setLeaveError(null);
    setLeaving(true);
    try {
      await signOut();
    } catch {
      setLeaveError("Couldn't log out. Try again.");
      setLeaving(false);
    }
  }, [leaving, mutation.isPending, signOut]);

  const canSubmit =
    !formatError && normalized.length >= MIN_USERNAME_LENGTH && !mutation.isPending && !leaving;

  return (
    <BottomSheet
      open={open}
      dismissable={false}
      showHandle={false}
      label="Pick your username"
      zClassName="z-[105]"
      className="relative"
    >
      <div className="flex flex-col items-center gap-2 text-center mt-4">
        <SmileyFaceIcon className="h-14 w-14" />
        <h2 className="text-lg leading-tight mt-6">What shall we call you?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mt-0">
          This is how players see you
        </p>
      </div>

      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        You can only set this once, so choose carefully.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-2.5">
        <label htmlFor="username-input" className="sr-only">
          Username
        </label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground"
          >
            @
          </span>
          <input
            id="username-input"
            value={value}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={MAX_USERNAME_LENGTH}
            placeholder="wordfox"
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={formatError !== null || availability.state === "taken"}
            aria-describedby="username-hint"
            className="w-full rounded-md bg-surface-2 py-2.5 pl-9 pr-4 text-base font-bold text-foreground outline-none ring-sky placeholder:font-normal placeholder:text-muted-foreground focus:ring-2"
          />
        </div>

        <p id="username-hint" role="status" className="min-h-5 text-xs font-light text-right">
          {formatError ? (
            <span className="text-destructive">{USERNAME_ERROR_COPY[formatError]}</span>
          ) : availability.state === "taken" ? (
            <span className="text-destructive">{availability.reason}</span>
          ) : availability.state === "checking" ? (
            <span className="text-muted-foreground">Checking availability</span>
          ) : availability.state === "free" ? (
            <span className="inline-flex items-center gap-1.5 text-mint">
              <CheckIcon className="h-3.5 w-3.5" />
              {normalized} is available
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              {MIN_USERNAME_LENGTH}–{MAX_USERNAME_LENGTH} characters. Letters, numbers and
              underscores.
            </span>
          )}
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="soft-btn btn-sky w-full py-3 text-sm tracking-wide disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Claim username"}
        </button>

        {mutation.error && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {mutation.error.message}
          </p>
        )}

        <p className="mt-1 text-center text-xs font-semibold leading-relaxed text-muted-foreground">
          Wrong account?{" "}
          <button
            type="button"
            onClick={goBack}
            disabled={leaving || mutation.isPending}
            className="press font-bold text-foreground underline underline-offset-2 disabled:opacity-60"
          >
            {leaving ? "Logging out" : "Back to log in"}
          </button>
        </p>

        {leaveError && (
          <p role="alert" className="text-center text-sm font-semibold text-destructive">
            {leaveError}
          </p>
        )}
      </form>
    </BottomSheet>
  );
}
