"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { BottomSheet } from "@/components/BottomSheet";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { LeftArrowIcon } from "@/components/icons/LeftArrowIcon";
import { SmileyFaceIcon } from "@/components/icons/SmileyFaceIcon";
import { useAuth } from "@/hooks/use-auth";
import { useAccount } from "@/hooks/use-account";
import { useSession } from "@/hooks/use-session";
import { checkUsernameFn, setUsernameFn } from "@/lib/game/api.client";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_ERROR_COPY,
  normalizeUsername,
  validateUsername,
} from "@/lib/account/names";

/** Long enough to stop a request per keystroke, short enough to feel live. */
const CHECK_DEBOUNCE_MS = 400;

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "free" }
  | { state: "taken"; reason: string };

/**
 * One-time username picker, shown after login to any account that does not have
 * one yet.
 *
 * Picking is mandatory: the username is the player's only name — what an opponent
 * sees on the score bar as well as what the leaderboard ranks — so an account
 * without one cannot meaningfully play. The backdrop and Escape are inert, and
 * the sheet stays put until a name is claimed.
 *
 * The one way out is backwards. A back arrow signs the player out, which drops
 * them onto the login wall — the step they came from. That is a deliberate
 * choice of glyph: a cross would promise dismissal, and there is nothing to
 * dismiss to, whereas an arrow promises the previous step and delivers exactly
 * that. It is how someone who logged in with the wrong account gets out, and the
 * price is logging in again.
 */
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

  // Availability is checked as the player types so a taken name surfaces before
  // they commit to it. Only well-formed candidates are worth a request.
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
          // Let them submit anyway; the unique index is the real gate.
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

  /**
   * Steps back to the login sheet by signing out.
   *
   * Nothing is cleared beyond the session: the account, its stars and its games
   * stay exactly as they are, so logging back in returns to this same sheet. No
   * confirmation dialog, because there is nothing to lose — only the walk back.
   */
  const goBack = useCallback(async () => {
    if (leaving || mutation.isPending) return;
    setLeaveError(null);
    setLeaving(true);
    try {
      // `isLoginRequired` flips as soon as this resolves, which closes this sheet
      // and opens the auth sheet. No navigation needed.
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
      // An account without a username has nowhere meaningful to land, so the
      // backdrop and Escape are inert.
      dismissable={false}
      showHandle={false}
      label="Pick your username"
      // Above the auth sheet, since this one blocks too and comes after it.
      zClassName="z-[105]"
      // Anchors the back arrow, so the hero block below stays optically centred
      // instead of being pushed off-centre by a button in the flow.
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

        {/*
          Spells out what the back arrow costs. The arrow alone says "previous
          step" but not "and you will be logged out", and that is the part worth
          knowing before pressing it.
        */}
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
