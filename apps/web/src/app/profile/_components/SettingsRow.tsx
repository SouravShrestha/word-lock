"use client";

import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const ROW = "flex w-full items-center gap-3.5 px-2 py-4 text-left";

function Body({
  label,
  hint,
  labelClassName,
}: {
  label: string;
  hint?: ReactNode;
  labelClassName?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className={cn("text-sm font-medium tracking-wide", labelClassName)}>{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SettingsRow({
  label,
  hint,
  href,
  onClick,
  className,
  destructive = false,
}: {
  label: string;
  hint?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}) {
  const content = (
    <div className="py-1 flex flex-row justify-between w-full">
      <Body
        label={label}
        hint={hint}
        labelClassName={destructive ? "text-destructive" : undefined}
      />
      {!destructive && (
        <ChevronRightIcon
          aria-hidden
          size={16}
          className="shrink-0 text-muted-foreground"
          strokeWidth={2.5}
        />
      )}
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

export function SettingsField({
  label,
  value,
  hint,
}: {
  label: string;
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

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}
