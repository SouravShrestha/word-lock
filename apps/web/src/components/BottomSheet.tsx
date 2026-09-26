"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const [prevOpen, setPrevOpen] = useState(open);
  const openedAt = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setRendered(true);
      setClosing(false);
    } else {
      setClosing((wasClosing) => wasClosing || rendered);
    }
  }

  useEffect(() => {
    if (open) {
      openedAt.current = Date.now();
    }
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe "has mounted" flag, must run after the initial client render
    setMounted(true);
  }, []);

  const guardedClose = useCallback(() => {
    if (Date.now() - openedAt.current < 300) return;
    onClose?.();
  }, [onClose]);

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

  // Moves focus into the sheet on open and back to whatever triggered it on
  // close — without this, a screen reader or keyboard user stays anchored to
  // a trigger button that's now behind an overlay, or to nothing at all once
  // the sheet unmounts.
  useEffect(() => {
    if (!open) {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? panelRef.current)?.focus();
  }, [open]);

  // Traps Tab navigation inside the sheet while it's open, including
  // non-dismissable ones (the login wall) where there is no other way out of
  // the sheet than completing it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
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
