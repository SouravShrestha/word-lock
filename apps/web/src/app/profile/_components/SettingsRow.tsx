"use client";

import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const ROW = "flex min-h-16 w-full items-center text-left";

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <section className="flex flex-col">{children}</section>;
}

function Body({
  icon,
  label,
  hint,
  value,
}: {
  icon?: ReactNode;
  label: string;
  hint?: ReactNode;
  value?: ReactNode;
}) {
  return (
    <>
      {icon ? <span className="flex w-8 shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-normal">{label}</span>
        {hint ? (
          <span className="mt-0.5 block tv-caption text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {value ? (
        <span className="ml-3 max-w-[60%] truncate text-sm font-normal text-muted-foreground">
          {value}
        </span>
      ) : null}
    </>
  );
}

const Chevron = () => (
  <ChevronRightIcon aria-hidden size={16} className="ml-2 shrink-0 text-muted-foreground" />
);

export function SettingsRow({
  icon,
  label,
  hint,
  value,
  href,
  onClick,
  className,
}: {
  icon?: ReactNode;
  label: string;
  hint?: ReactNode;
  value?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <Body icon={icon} label={label} hint={hint} value={value} />
      <Chevron />
    </>
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

export function SettingsInfoRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={ROW}>
      <Body icon={icon} label={label} value={value} />
    </div>
  );
}
