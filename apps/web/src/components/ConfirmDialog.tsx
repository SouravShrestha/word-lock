"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

/**
 * The app's one "are you sure?" surface, matching the back-button warning used
 * on the game screens: a centred card over a dimmed backdrop, cancel on the
 * left and the destructive action on the right.
 *
 * Deliberately not a bottom sheet — those are for flows the player opted into,
 * while this interrupts one.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isPending = false,
  pendingLabel,
  zClassName = "z-50",
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  /** Shown on the confirm button while `isPending`. */
  pendingLabel?: string;
  /**
   * Stacking level. Raise it when the dialog interrupts something that is
   * already floating, such as a bottom sheet.
   */
  zClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isPending, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn("fixed inset-0 flex items-center justify-center bg-black/60 px-6", zClassName)}
    >
      <div className="surface flex w-full max-w-xs flex-col gap-4 p-6">
        <div className="text-center">
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="soft-btn btn-surface-2 flex-1 py-3 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="soft-btn btn-danger flex-1 py-3 disabled:opacity-60"
          >
            {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
