"use client";

import { useCallback, useState } from "react";

import { BottomSheet } from "@/components/BottomSheet";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { MailIcon } from "@/components/icons/MailIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { StreakIcon } from "@/components/icons/StreakIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { TrophyNavIcon } from "@/components/icons/nav/TrophyNavIcon";
import { useAuth } from "@word-lock/client";

const PERKS = [
  {
    Icon: TrophyNavIcon,
    label: "Leaderboard ranking",
    iconClass: "h-5 w-5",
  },
  {
    Icon: StreakIcon,
    label: "Daily streaks that stick",
    iconClass: "h-[1.1rem] w-[1.1rem] ml-[4px]",
  },
  {
    Icon: StarIcon,
    label: "Stars, leagues and full match history",
    iconClass: "h-[1.4rem] w-[1.4rem] text-mint",
  },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = "choose" | "sending" | "sent";

export function AuthSheet() {
  const { isLoginRequired, signInWithGoogle, signInWithEmail } = useAuth();

  const [phase, setPhase] = useState<Phase>("choose");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const onGoogle = useCallback(async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Couldn't reach Google. Try again, or use a magic link.");
      setGoogleBusy(false);
    }
  }, [signInWithGoogle]);

  const onEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!EMAIL_PATTERN.test(trimmed)) {
        setError("That email doesn't look right.");
        return;
      }

      setError(null);
      setPhase("sending");
      try {
        await signInWithEmail(trimmed);
        setPhase("sent");
      } catch {
        setError("Couldn't send that link. Wait a moment and try again.");
        setPhase("choose");
      }
    },
    [email, signInWithEmail],
  );

  const busy = googleBusy || phase === "sending";
  const heading = phase === "sent" ? "Check your inbox" : "Log in to play";

  return (
    <BottomSheet open={isLoginRequired} label={heading} dismissable={false} showHandle={false}>
      <h2 className="text-lg leading-tight">{heading}</h2>

      {phase === "sent" ? (
        <>
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <span className="text-mint">
              <CheckIcon className="h-9 w-9" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a login link to <span className="font-semibold text-foreground">{email}</span>
              . Open it on this device to finish logging in.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPhase("choose");
                setError(null);
              }}
              className="soft-btn btn-surface-2 w-full py-3 text-sm tracking-wide"
            >
              Use a different email
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            You need an account so your games, stars and streak follow you across devices.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {PERKS.map(({ Icon, label, iconClass }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex w-6 shrink-0 items-center justify-center">
                  <Icon className={iconClass} />
                </span>
                <span className="font-display text-sm tracking-wide text-muted-foreground">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="soft-btn btn-surface-2 flex w-full items-center justify-center gap-2.5 py-3 text-sm tracking-wide disabled:opacity-60"
            >
              <GoogleIcon className="h-[1.15rem] w-[1.15rem]" />
              {googleBusy ? "Opening Google…" : "Continue with Google"}
            </button>

            <div className="my-1 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-muted-foreground/20" />
              <span className="font-display text-xs tracking-wide text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-muted-foreground/20" />
            </div>

            <form onSubmit={onEmail} className="flex flex-col gap-2.5">
              <label htmlFor="auth-email" className="sr-only">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@example.com"
                aria-invalid={error !== null}
                aria-describedby={error ? "auth-error" : undefined}
                className="w-full rounded-xl bg-surface-2 px-4 py-2.5 text-base font-bold text-foreground outline-none ring-sky placeholder:font-normal placeholder:text-muted-foreground focus:ring-2"
              />
              <button
                type="submit"
                disabled={busy}
                className="soft-btn btn-sky flex w-full items-center justify-center gap-2.5 py-3 text-sm tracking-wide disabled:opacity-60"
              >
                <MailIcon className="h-[1.05rem] w-[1.05rem]" />
                {phase === "sending" ? "Sending…" : "Email me a link"}
              </button>
            </form>

            {error && (
              <p id="auth-error" role="alert" className="text-sm font-semibold text-destructive">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs font-semibold text-muted-foreground">
            <a
              href="/how-to-play"
              target="_blank"
              rel="noreferrer"
              className="press underline underline-offset-2"
            >
              How to play
            </a>
            <span aria-hidden className="mx-2 opacity-50">
              ·
            </span>
            <a
              href="/legal/privacy"
              target="_blank"
              rel="noreferrer"
              className="press underline underline-offset-2"
            >
              Privacy policy
            </a>
          </p>
        </>
      )}
    </BottomSheet>
  );
}
