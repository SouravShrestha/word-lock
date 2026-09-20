"use client";

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
import { useAccount } from "@/hooks/use-account";
import { useAuth } from "@/hooks/use-auth";
import { browserTimezone } from "@/lib/account/timezone";
import { PRIVACY_URL, TERMS_URL, siteUrl, supportMailto } from "@/lib/app-meta";
import { AboutSheet } from "./AboutSheet";
import { AcknowledgementsSheet } from "./AcknowledgementsSheet";
import { SettingsField, SettingsGroup, SettingsRow } from "./SettingsRow";

/** Which nested sheet is on top of settings, if any. */
type Nested = "rules" | "leagues" | "about" | "credits" | null;

/** Sits above the settings sheet's own z-[80]. */
const NESTED_Z = "z-[90]";

/**
 * How the caller signed in. Read from the verified user rather than guessed, and
 * worth surfacing: someone locked out of their account usually cannot remember
 * whether they used Google or a link, and that is the first thing support needs.
 */
function signInMethod(provider?: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "Email magic link";
  return "Email";
}

/**
 * Settings. A full-height sheet rather than a page, so it can be opened from
 * the profile and dismissed back to exactly where the player was.
 *
 * Four sections, ordered by how often they are wanted: the preferences a player
 * actually toggles, the account they belong to, the reference material, then
 * support. Log out sits below all of it, on its own — the one action here that
 * ends the session, not a peer of the account fields above it. Everything deeper
 * opens as a nested sheet stacked on this one via `zClassName` — a z-index
 * through `className` would lift only the panel and leave its backdrop
 * underneath.
 *
 * The guides are not written here. "How to play" and the league ladder already
 * exist as sheets on the home and leaderboard screens; settings is a second door
 * to the same components, because those screens are the only places a player can
 * currently find them and neither is where people look for help.
 *
 * The logout confirmation is rendered as a sibling of the sheet, not inside it:
 * the sheet portals and animates its panel, and a `fixed` overlay nested in
 * that panel would be positioned against it mid-animation.
 */
export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { ready, user, signOut } = useAuth();
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

  /*
   * Logging out is a one-way door now that an account is required to play: the
   * login wall goes straight back up, and until they log in again there is no
   * app to use. Home is the only sensible place to land, so the wall is not
   * sitting on top of a screen they cannot act on.
   */
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

  /*
   * The native share sheet where there is one, a copied link where there is not.
   * An abort is the player backing out, not a failure, so it is swallowed
   * silently rather than reported as an error.
   */
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
        // The player backing out of the native sheet is not a failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else (permission denied, unsupported in this webview, etc.)
        // falls through to the clipboard copy below instead of doing nothing.
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
        /*
         * Sealed while something is stacked on top. Escape is a window listener
         * in every sheet and dialog, so an open nested sheet and this one would
         * both hear the same keypress and the player would lose settings as well
         * as the thing they were dismissing.
         */
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

              {/*
                Not a setting, but the answer to "why did my streak reset?".
                The server advances the streak against this exact zone, reported
                by the browser, so a player who travels or has an odd device
                clock has no other way to see what "today" means to the game.
              */}
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
              {/*
                Read-only on purpose: a username is claimable exactly once, and
                the only place that rule is currently stated is the sheet that
                claims it — which is the one moment nobody is reading carefully.
              */}
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
              <SettingsRow label="Email us" href={supportMailto()} />
              {PRIVACY_URL ? <SettingsRow label="Privacy policy" href={PRIVACY_URL} /> : null}
              {TERMS_URL ? <SettingsRow label="Terms of service" href={TERMS_URL} /> : null}
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
