"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
  onClose?: () => void;
  label: string;
  className?: string;
  zClassName?: string;
  dismissable?: boolean;
  showHandle?: boolean;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const openedAt = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe "has mounted" flag, must run after the initial client render
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an `open` prop transition, not derivable at render time
      setRendered(true);
      setClosing(false);
      openedAt.current = Date.now();
    } else {
      setClosing((wasClosing) => wasClosing || rendered);
    }
  }, [open, rendered]);

  const guardedClose = useCallback(() => {
    if (Date.now() - openedAt.current < 300) return;
    onClose?.();
  }, [onClose]);

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
      if (e.key === "Escape") guardedClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, guardedClose]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={dismissable ? guardedClose : undefined}
        className={cn(
          "fixed inset-0 bg-black/50 duration-200",
          !dismissable && "pointer-events-none",
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
