import { avatarUrl } from "@word-lock/core/account";
import { cn } from "@/lib/utils";

export function Avatar({
  avatar,
  className,
  alt = "",
}: {
  avatar: string | null | undefined;
  className?: string;
  alt?: string;
}) {
  const src = avatarUrl(avatar);

  return (
    <span
      aria-hidden={alt === "" ? true : undefined}
      className={cn(
        "grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2",
        className,
      )}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
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
