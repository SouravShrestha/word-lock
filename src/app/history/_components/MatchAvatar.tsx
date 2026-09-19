import { AvatarMonkeyIcon } from "@/components/icons/AvatarMonkeyIcon";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";
import { cn } from "@/lib/utils";

/**
 * Round avatar for an opponent in the match list.
 *
 * Players have no picture of their own, so the glyph is derived from a stable
 * key (the opponent's id, falling back to their name). Derived rather than
 * random so the same opponent keeps the same face every time the list
 * renders — a row that reshuffled its avatar on refetch would read as a
 * different person.
 */
export function MatchAvatar({ seed, className }: { seed: string; className?: string }) {
  const hash = hashOf(seed);
  const isPanda = hash % 2 === 0;

  return (
    <span
      aria-hidden
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-2 text-foreground",
        className,
      )}
    >
      {isPanda ? <AvatarPandaIcon className="h-7 w-7" /> : <AvatarMonkeyIcon className="h-8 w-8" />}
    </span>
  );
}

/** djb2, trimmed. Any stable spread over the palette will do. */
function hashOf(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
