"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Controlled bottom sheet. Portalled to `document.body` and slid up from the
 * bottom edge, so it sits on top of the bottom nav instead of stopping above
 * it. Stays mounted for the slide-down before leaving the DOM.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  className,
  zClassName = "z-[80]",
  dismissable = true,
  showHandle = true,
  children,
}: {
  open: boolean;
  /**
   * Called on backdrop click and Escape. The parent owns `open`. Never called
   * when `dismissable` is false.
   */
  onClose?: () => void;
  /** Accessible name for the dialog. */
  label: string;
  className?: string;
  /**
   * Stacking level for the backdrop and the sheet together. Override when a
   * sheet has to sit above another one — passing a z-index through `className`
   * would only move the panel and leave its backdrop behind.
   */
  zClassName?: string;
  /**
   * When false the sheet cannot be closed from the outside: the backdrop
   * swallows clicks and Escape does nothing. For a blocking sheet the caller is
   * responsible for offering the only way forward inside the sheet itself.
   */
  dismissable?: boolean;
  /** The grab handle implies "drag me away", so hide it on a blocking sheet. */
  showHandle?: boolean;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  /** Kept true through the exit animation. */
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe "has mounted" flag, must run after the initial client render
    setMounted(true);
  }, []);

  // Syncs local animation state to the `open` prop. This can't be derived
  // during render because it has to distinguish "just opened" from "still
  // open" and "just closed" from "still closed" across renders.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an `open` prop transition, not derivable at render time
      setRendered(true);
      setClosing(false);
    } else {
      setClosing((wasClosing) => wasClosing || rendered);
    }
  }, [open, rendered]);

  // Fallback unmount in case `animationend` never fires (reduced motion, tab
  // backgrounded mid-animation), which would otherwise leave the sheet stuck.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={dismissable ? onClose : undefined}
        className={cn(
          "fixed inset-0 bg-black/50 duration-200",
          zClassName,
          closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in",
        )}
      />

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 flex justify-center",
          zClassName,
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          // Ignore animations bubbling up from content, which would otherwise
          // unmount the sheet mid-entrance.
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget || !closing) return;
            setRendered(false);
            setClosing(false);
          }}
          className={cn(
            "pointer-events-auto w-full max-w-md rounded-t-2xl bg-background p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
            // Sized to its content; the cap only kicks in on very short
            // viewports, where scrolling beats clipping.
            "max-h-[calc(100dvh-1.5rem)] overflow-y-auto",
            closing
              ? "animate-out slide-out-to-bottom fill-mode-forwards duration-200"
              : "animate-in slide-in-from-bottom duration-300",
            className,
          )}
        >
          {showHandle && (
            <div
              aria-hidden
              className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-muted-foreground/30"
            />
          )}
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
