import type { ReactNode } from "react";

import { SkipIcon } from "@/components/icons/SkipIcon";
import { BinIcon } from "@/components/icons/BinIcon";
import { BackspaceIcon } from "@/components/icons/BackspaceIcon";
import { EnterIcon } from "@/components/icons/EnterIcon";
import { cn } from "@/lib/utils";

function ActionButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 text-foreground",
        "disabled:pointer-events-none disabled:opacity-35",
      )}
    >
      {children}
    </button>
  );
}

export function ActionBar({
  yourTurn,
  selectionLength,
  onPass,
  onClear,
  onBackspace,
  onSubmit,
  passPending,
  submitPending,
}: {
  yourTurn: boolean;
  selectionLength: number;
  onPass: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  passPending: boolean;
  submitPending: boolean;
}) {
  return (
    <div className="flex items-center justify-around gap-4 px-4 py-2">
      <ActionButton label="Pass turn" onClick={onPass} disabled={!yourTurn || passPending}>
        <SkipIcon className="h-4 w-4 ml-0.5" />
      </ActionButton>

      <ActionButton
        label="Clear selection"
        onClick={onClear}
        disabled={!yourTurn || selectionLength === 0}
      >
        <BinIcon className="h-4 w-4" />
      </ActionButton>

      <ActionButton
        label="Remove last tile"
        onClick={onBackspace}
        disabled={!yourTurn || selectionLength === 0}
      >
        <BackspaceIcon className="h-4 w-4" />
      </ActionButton>

      <ActionButton
        label="Submit word"
        onClick={onSubmit}
        disabled={!yourTurn || selectionLength < 3 || submitPending}
      >
        <EnterIcon className="h-4 w-4" />
      </ActionButton>
    </div>
  );
}
