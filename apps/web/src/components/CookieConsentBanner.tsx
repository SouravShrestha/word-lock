"use client";

/**
 * A basic notice-and-accept banner, not a full IAB TCF/consent-mode CMP.
 * The privacy policy already promises EEA/UK/Switzerland visitors a consent
 * prompt before personalised ads — this is the minimal version of that until
 * AdSense is actually wired up, at which point a real CMP (e.g. Google
 * Funding Choices) should replace it rather than this banner gating anything
 * ad-specific itself.
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wl_cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Storage unavailable (private mode, disabled) — nothing to persist, skip the banner.
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // Ignore — the banner just won't remember the choice next visit.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-3 border-t border-border/60 bg-background/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-md">
        Word lock uses cookies for sign-in and, where permitted, for advertising. See the{" "}
        <a
          href="/legal/privacy"
          className="font-semibold text-foreground underline underline-offset-2"
        >
          privacy policy
        </a>{" "}
        for details and your choices.
      </p>
      <button
        type="button"
        onClick={accept}
        className="soft-btn btn-sky shrink-0 self-start px-4 py-2 text-xs tracking-wide sm:self-auto"
      >
        Got it
      </button>
    </div>
  );
}
