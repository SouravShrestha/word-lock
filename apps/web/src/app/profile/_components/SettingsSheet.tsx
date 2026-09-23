"use client";
import { useAccount, useAuth, useSession } from "@word-lock/client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { BottomSheet } from "@/components/BottomSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { LeagueGuideSheet } from "@/components/LeagueGuideSheet";
import { SectionLabel } from "@/components/SectionLabel";
import { Toggle } from "@/components/Toggle";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { browserTimezone } from "@word-lock/core/account";
import { PRIVACY_URL, TERMS_URL, siteUrl, supportMailto } from "@/lib/app-meta";
import { AboutSheet } from "./AboutSheet";
import { AcknowledgementsSheet } from "./AcknowledgementsSheet";
import { SettingsField, SettingsGroup, SettingsRow } from "./SettingsRow";

type Nested = "rules" | "leagues" | "about" | "credits" | null;

const NESTED_Z = "z-[90]";

function signInMethod(provider?: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "Email magic link";
  return "Email";
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { ready, user, signOut } = useAuth();
  const { sessionId } = useSession();
  const { data: account } = useAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [nested, setNested] = useState<Nested>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the resolved theme is only known on the client
    setMounted(true);
  }, []);

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setConfirming(false);
      onClose();
      router.push("/");
    } catch {
      toast.error("Couldn't log out. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    const url = siteUrl();
    const payload = {
      title: "Word lock",
      text: "Play a game of Word lock with me",
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        label="Settings"
        showHandle={false}
        dismissable={nested === null && !confirming}
        className="h-dvh max-h-dvh rounded-t-none pt-[calc(1.5rem+env(safe-area-inset-top))]"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="soft-icon-btn btn-danger h-8 w-8"
          >
            <CrossIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionLabel>Preferences</SectionLabel>
            <SettingsGroup>
              <div className="flex items-center gap-3.5 px-2 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Dark theme</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Easier on the eyes</p>
                </div>
                <Toggle
                  label="Dark theme"
                  checked={mounted && theme === "dark"}
                  onChange={(next) => setTheme(next ? "dark" : "light")}
                />
              </div>

              <SettingsField
                label="Time zone"
                value={mounted ? (browserTimezone() ?? "UTC") : "…"}
                hint="Taken from your device."
              />
            </SettingsGroup>
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>Account</SectionLabel>
            <SettingsGroup>
              <SettingsField
                label="Username"
                value={account?.username ? `@${account.username}` : "…"}
                hint="Usernames are permanent and can't be changed."
              />
              <SettingsField label="Email" value={ready ? (user?.email ?? "Logged in") : "…"} />
            </SettingsGroup>
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>Guides</SectionLabel>
            <SettingsGroup>
              <SettingsRow label="How to play" onClick={() => setNested("rules")} />
              <SettingsRow label="League tiers" onClick={() => setNested("leagues")} />
            </SettingsGroup>
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>Support</SectionLabel>
            <SettingsGroup>
              <SettingsRow label="About" onClick={() => setNested("about")} />
              {PRIVACY_URL ? <SettingsRow label="Privacy policy" href={PRIVACY_URL} /> : null}
              {TERMS_URL ? <SettingsRow label="Terms of service" href={TERMS_URL} /> : null}
              <SettingsRow label="Email us" href={supportMailto()} />
              <SettingsRow label="Acknowledgements" onClick={() => setNested("credits")} />
            </SettingsGroup>
          </section>

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy || !ready}
            className="soft-btn btn-surface-2 w-full py-3 text-sm tracking-wide disabled:opacity-60"
          >
            {busy ? "Logging out" : "Log out"}
          </button>
        </div>
      </BottomSheet>

      <HowToPlaySheet
        open={nested === "rules"}
        onClose={() => setNested(null)}
        zClassName={NESTED_Z}
      />
      <LeagueGuideSheet
        open={nested === "leagues"}
        onClose={() => setNested(null)}
        zClassName={NESTED_Z}
      />
      <AboutSheet open={nested === "about"} onClose={() => setNested(null)} zClassName={NESTED_Z} />
      <AcknowledgementsSheet
        open={nested === "credits"}
        onClose={() => setNested(null)}
        zClassName={NESTED_Z}
      />

      <ConfirmDialog
        open={confirming}
        zClassName="z-[90]"
        title="Log out?"
        description={
          <>
            An account is needed to play, so you&apos;ll be locked out until you log back in.
            <br />
            Your stars, streak and match history are kept safe on your account.
          </>
        }
        confirmLabel="Log out"
        pendingLabel="Logging out…"
        onConfirm={onSignOut}
        onCancel={() => setConfirming(false)}
        isPending={busy}
      />
    </>
  );
}
