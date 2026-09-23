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

const getOwnerStyles = (owner: TileOwner, selected: boolean) => {
  if (selected) return "bg-primary text-on-accent";
  if (owner === 0) return "bg-board text-foreground";
  return owner === 1
    ? "bg-p1-soft text-p1-deep dark:text-white"
    : "bg-p2-soft text-p2-deep dark:text-white";
};

const getLockedCircleFill = (owner: TileOwner) => {
  if (owner === 1) return "bg-p1 text-white";
  if (owner === 2) return "bg-p2 text-white";
  return "bg-card/20";
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
      className={cn(
        "tile-face relative aspect-square w-full text-[clamp(0.85rem,3.5vw,1.25rem)] border-r border-b border-border",
        getOwnerStyles(owner, selected),
        disabled && "cursor-default",
      )}
    >
      {locked ? (
        <span
          className={cn(
            "flex items-center justify-center w-[62%] aspect-square rounded-full",
            getLockedCircleFill(owner),
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
