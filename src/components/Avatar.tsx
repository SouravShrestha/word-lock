import { avatarUrl } from "@/lib/account/avatars";
import { cn } from "@/lib/utils";

/**
 * A player's avatar, as a round image.
 *
 * One component for every surface — profile, lobby, match history — so a player
 * looks the same everywhere. Callers pass the stored id and size it through
 * `className`; the fallback for a missing or unknown id lives in `avatarUrl`, so
 * there is no empty state to design around.
 *
 * A plain `<img>` rather than `next/image`: the app deploys to Cloudflare Workers
 * through OpenNext, where the image optimiser is extra machinery this does not
 * need — these are a handful of small PNGs on a public, cacheable storage URL.
 */
export function Avatar({
  avatar,
  className,
  alt = "",
}: {
  avatar: string | null | undefined;
  className?: string;
  /** Leave empty where the name is already next to the picture. */
  alt?: string;
}) {
  const src = avatarUrl(avatar);

  return (
    <span
      // Decorative when it sits beside the name it belongs to, which is the
      // common case; a label makes it worth announcing.
      aria-hidden={alt === "" ? true : undefined}
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2",
        className,
      )}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- see the note above on next/image
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}
