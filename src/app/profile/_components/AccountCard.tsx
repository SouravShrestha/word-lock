"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/use-auth";

/**
 * Account status on the profile screen: which account is signed in, and the way
 * out. There is no guest state to render — reaching this screen at all means
 * being logged in.
 */
export function AccountCard() {
  const { ready, user, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Avoid flashing the card before the session is known.
  if (!ready) return null;

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
      router.push("/");
    } catch {
      toast.error("Couldn't log out. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="surface flex items-center gap-3.5 p-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-xs text-muted-foreground">Account</p>
          <p className="mt-0.5 truncate text-sm font-bold" title={user?.email ?? undefined}>
            {user?.email ?? "Logged in"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy}
          className="soft-btn btn-surface-2 shrink-0 px-3.5 py-2 text-xs tracking-wide disabled:opacity-60"
        >
          {busy ? "Logging out…" : "Log out"}
        </button>
      </section>

      <ConfirmDialog
        open={confirming}
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
