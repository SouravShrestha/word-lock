"use client";

import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const ROW = "flex w-full items-center gap-3.5 px-2 py-4 text-left";

function Body({ label, hint }: { label: string; hint?: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium tracking-wide">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * A tappable settings row: label, optional hint, chevron.
 *
 * Renders an anchor when given `href` and a button otherwise, because the two
 * things a row does here are genuinely different — open a sheet in place, or
 * leave the app. An anchor lets the browser do the second one properly
 * (long-press, copy link, open in a new tab), which a button with an
 * onClick-navigation would take away.
 */
export function SettingsRow({
  label,
  hint,
  href,
  onClick,
  className,
}: {
  label: string;
  hint?: ReactNode;
  /** External or cross-document destination. Opens in a new tab. */
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <div className="py-1 flex flex-row justify-between w-full">
      <Body label={label} hint={hint} />
      <ChevronRightIcon
        aria-hidden
        size={16}
        className="shrink-0 text-muted-foreground"
        strokeWidth={2.5}
      />
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(ROW, "press", className)}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(ROW, "press", className)}>
      {content}
    </button>
  );
}

/**
 * A read-only settings row: something about the account or the device that a
 * player may need to read out, but cannot change here. No chevron, no press
 * feedback — an affordance would promise an editor that does not exist.
 */
export function SettingsField({
  label,
  value,
  hint,
}: {
  label: string;
  /** Rendered as given. Pass a placeholder while the account is loading. */
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className={ROW}>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[0.65rem] text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium tracking-wide">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

/** Rows stacked with hairline separators, matching the card edges elsewhere. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}
