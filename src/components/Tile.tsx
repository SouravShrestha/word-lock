"use client";

import { cn } from "@/lib/utils";

export type TileOwner = 0 | 1 | 2;

interface TileProps {
  letter: string;
  owner: TileOwner;
  locked?: boolean;
  selected?: boolean;
  order?: number | null;
  onClick?: () => void;
  disabled?: boolean;
}

const getOwnerStyles = (owner: TileOwner, locked: boolean, selected: boolean) => {
  if (!selected) {
    // Unselected - original styles unchanged
    if (owner === 0) return "bg-neutral-tile text-foreground";
    if (locked) {
      return owner === 1 ? "bg-p1 text-tile-text" : "bg-p2 text-tile-text";
    }
    return owner === 1
      ? "bg-p1-soft text-p1-deep dark:bg-p1-soft dark:text-p1"
      : "bg-p2-soft text-p2-deep dark:bg-p2-soft dark:text-p2";
  }

  // Selected - always bg-primary, lift, then text depends on ownership
  const lift = "-translate-y-0.5";
  if (owner === 0) return `bg-primary text-primary-foreground ${lift}`;
  if (owner === 1) return `bg-primary text-p1 ${lift}`;
  return `bg-primary text-p2 ${lift}`;
};

// Circle border is always the locking owner's vivid color, regardless of selection
const getLockedCircleBorder = (owner: TileOwner) => {
  if (owner === 1) return "border-p1";
  if (owner === 2) return "border-p2";
  return "border-current/50";
};

export function Tile({
  letter,
  owner,
  locked = false,
  selected = false,
  order = null,
  onClick,
  disabled,
}: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Letter ${letter}${locked ? ", locked" : ""}`}
      data-sound="key"
      className={cn(
        "tile-face relative aspect-square w-full text-[clamp(0.85rem,3.5vw,1.25rem)]",
        getOwnerStyles(owner, locked, selected),
        disabled && "cursor-default",
      )}
    >
      {locked ? (
        <span
          className={cn(
            "flex items-center justify-center w-[60%] aspect-square rounded-full border-2 bg-black/15",
            getLockedCircleBorder(owner),
          )}
        >
          {letter}
        </span>
      ) : (
        letter
      )}
    </button>
  );
}
