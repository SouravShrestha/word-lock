"use client";
import { useAccount, useAuth, useSession } from "@word-lock/client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { BottomSheet } from "@/components/BottomSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CrossIcon } from "@/components/icons/CrossIcon";
import {
  AppearanceIcon,
  FeedbackIcon,
  MailIcon,
  ProfileIcon,
  ShieldCheckIcon,
} from "@word-lock/icons";
import { PRIVACY_URL, SUPPORT_EMAIL, siteUrl, supportMailto } from "@/lib/app-meta";
import { AppearanceSheet, THEME_LABELS } from "./AppearanceSheet";
import { SettingsInfoRow, SettingsRow } from "./SettingsRow";

function signInMethod(provider?: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "Email magic link";
  return "Email";
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const { ready, user, signOut } = useAuth();
  const { sessionId } = useSession();
  const { data: account } = useAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

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
        dismissable={!confirming && !appearanceOpen}
        className="h-dvh max-h-dvh rounded-t-none pt-[calc(1.5rem+env(safe-area-inset-top))]"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="soft-icon-btn btn-danger h-8 w-8"
          >
            <CrossIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2">
          <SettingsInfoRow
            icon={<ProfileIcon size={16} />}
            label="Username"
            value={account?.username ? `@${account.username}` : "…"}
          />
          <SettingsInfoRow
            icon={<MailIcon size={16} />}
            label="Email"
            value={ready ? (user?.email ?? "Logged in") : "…"}
          />
          <SettingsRow
            icon={<AppearanceIcon size={16} />}
            label="Appearance"
            value={mounted ? (THEME_LABELS[theme ?? "system"] ?? "System") : "…"}
            onClick={() => setAppearanceOpen(true)}
          />

          {PRIVACY_URL ? (
            <SettingsRow
              icon={<ShieldCheckIcon size={18} />}
              label="Privacy policy"
              href={PRIVACY_URL}
            />
          ) : null}
          <SettingsRow
            icon={<FeedbackIcon size={18} />}
            label="Email us"
            value={SUPPORT_EMAIL}
            href={supportMailto()}
          />

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy || !ready}
            className="press mt-8 w-full rounded-2xl border border-border py-4 text-base disabled:opacity-60"
          >
            {busy ? "Logging out" : "Log out"}
          </button>
        </div>
      </BottomSheet>

      <AppearanceSheet
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        zClassName="z-[90]"
      />

      <ConfirmDialog
        open={confirming}
        zClassName="z-[90]"
        title="Log out?"
        description={
          <>
            An account is needed to play, so you&apos;ll be locked out until you log back in.
            <br />
            Your medals, streak and match history are kept safe on your account.
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
