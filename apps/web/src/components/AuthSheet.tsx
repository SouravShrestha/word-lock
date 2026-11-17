"use client";

import { useCallback, useEffect, useState } from "react";

import { BottomSheet } from "@/components/BottomSheet";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { OneTimeCode } from "@/components/ui/one-time-code";
import { useAuth } from "@word-lock/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
/** Supabase allows one code per email per minute. */
const RESEND_COOLDOWN_MS = 60_000;
/** How long the "Verified" capsule shows before the sheet closes. */
const SUCCESS_HOLD_MS = 1200;

type Phase = "choose" | "sending" | "code" | "verifying";

export function AuthSheet() {
  const { isLoginRequired, signInWithGoogle, signInWithEmail, verifyEmailCode } = useAuth();

  const [phase, setPhase] = useState<Phase>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  // Keeps the sheet up past sign-in so the success capsule can play.
  const [held, setHeld] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const open = isLoginRequired || held;
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setPhase("choose");
      setCode("");
      setError(null);
      setVerified(false);
      setEmailOpen(false);
    }
  }

  const onGoogle = useCallback(async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Couldn't reach Google. Try again, or use a code instead.");
      setGoogleBusy(false);
    }
  }, [signInWithGoogle]);

  const onEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
    },
    [email, emailOpen, signInWithEmail],
  );

  const onVerify = useCallback(
    async (value: string) => {
      setError(null);
      setPhase("verifying");
      setHeld(true);
      try {
        await verifyEmailCode(email.trim(), value);
        setVerified(true);
        setTimeout(() => setHeld(false), SUCCESS_HOLD_MS);
      } catch {
        setError("That code didn't work. Check it and try again.");
        setCode("");
        setPhase("code");
        setHeld(false);
      }
    },
    [email, verifyEmailCode],
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

  const busy = googleBusy || phase === "sending" || phase === "verifying";
  const isCodePhase = phase === "code" || phase === "verifying";
  const heading = isCodePhase ? "Enter your code" : "Your friends are waiting";

  useEffect(() => {
    if (!isCodePhase) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isCodePhase]);

  const locked = phase === "verifying" || verified;
  const resendIn = Math.max(0, Math.ceil((sentAt + RESEND_COOLDOWN_MS - now) / 1000));

  return (
    <BottomSheet
      open={open}
      label={heading}
      dismissable={false}
      showHandle={false}
      // Above the username sheet, which opens underneath while "Verified" plays.
      zClassName={held ? "z-[110]" : undefined}
    >
      {isCodePhase ? (
        <>
          <p className="mt-2 text-center tv-body text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{email.trim()}</span>
          </p>

          {/* Spacing on a wrapper: the row sizes itself from its container. */}
          <div className="py-10">
            <OneTimeCode
              autoFocus
              length={CODE_LENGTH}
              value={code}
              status={
                verified
                  ? "success"
                  : phase === "verifying"
                    ? "verifying"
                    : error
                      ? "error"
                      : "idle"
              }
              errorMessage={error}
              onChange={(value) => {
                setCode(value);
                setError(null);
              }}
              onComplete={(value) => void onVerify(value)}
            />
          </div>

          <div className="flex items-center justify-between px-1 text-[0.8125rem] text-foreground">
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                setPhase("choose");
                setCode("");
                setError(null);
              }}
              className="press underline underline-offset-2 disabled:opacity-50"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={locked || resendIn > 0}
              onClick={() => void onResend()}
              className="press underline underline-offset-2 disabled:text-muted-foreground disabled:opacity-50"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-8">
            <form onSubmit={onEmail} className="flex flex-col gap-4">
              {emailOpen && (
                <>
                  <label htmlFor="auth-email" className="sr-only">
                    Email address
                  </label>
                  {error && (
                    <p
                      id="auth-error"
                      role="alert"
                      className="-mb-1 ml-4 self-start text-left text-[0.8125rem] font-normal text-destructive"
                    >
                      {error}
                    </p>
                  )}
                  <input
                    autoFocus
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
                    className="h-14 w-full rounded-2xl bg-surface-2 px-4 tv-body-base font-medium text-foreground outline-none ring-sky placeholder:font-normal placeholder:text-muted-foreground focus:ring-2"
                  />
                </>
              )}
              <button
                type="submit"
                disabled={busy}
                className="transition-[transform,box-shadow] duration-75 shadow-[0_4px_0_0_var(--btn-depth)] active:enabled:translate-y-[3px] active:enabled:shadow-[0_1px_0_0_var(--btn-depth)] [--btn-depth:var(--depth-grape)] flex w-full items-center justify-center h-14 rounded-2xl bg-grape font-display tv-body font-medium text-white disabled:opacity-60"
              >
                {phase === "sending" ? "Sending…" : "Sign in with Email"}
              </button>
            </form>

            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="transition-[transform,box-shadow] duration-75 shadow-[0_2px_0_0_var(--btn-depth)] active:enabled:translate-y-[1px] active:enabled:shadow-[0_1px_0_0_var(--btn-depth)] [--btn-depth:var(--hairline)] flex w-full items-center justify-center gap-3 h-14 rounded-2xl border-2 border-[var(--hairline)] bg-background font-display tv-body font-medium text-foreground disabled:opacity-60"
            >
              <GoogleIcon className="h-5 w-5" />
              {googleBusy ? "Opening Google…" : "Continue with Google"}
            </button>

            {error && !emailOpen && (
              <p
                id="auth-error"
                role="alert"
                className="text-[0.8125rem] font-normal text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <p className="mt-8 text-center text-[0.8125rem] font-normal text-muted-foreground">
            By continuing, you agree to our{" "}
            <a
              href="/legal/privacy"
              target="_blank"
              rel="noreferrer"
              className="press underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>
        </>
      )}
    </BottomSheet>
  );
}
