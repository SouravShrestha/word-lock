import { cn } from "@/lib/utils";

/**
 * Shimmer stand-ins for the headline and match list while the profile query
 * is in flight. Shaped like the real content (avatar circle, name line, meta
 * line) so the page doesn't jump when the data arrives.
 */
export function HistorySkeleton() {
  return (
    <div aria-hidden>
      <header className="pt-8">
        <span className="shimmer inline-block h-8 w-48 rounded-md" />
        <div className="mt-3 flex items-center gap-1.5">
          <span className="shimmer h-6 w-7 rounded-full" />
          <span className="shimmer h-4 w-10 rounded-sm" />
        </div>
      </header>

      <span className="shimmer mt-7 inline-block h-4 w-28 rounded-sm" />

      <ul className="-mx-5 mt-3 flex flex-col pt-1">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <MatchRowSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MatchRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-3.5 px-5 py-3.5 mt-1.5">
      <span className="shimmer h-14 w-14 shrink-0 rounded-full" />

      <span className="min-w-0 flex-1">
        <span className="shimmer block h-4 w-28 rounded-sm" />
        <span className={cn("mt-2 flex items-center gap-3")}>
          <span className="shimmer h-3 w-16 rounded-sm" />
          <span className="shimmer h-3 w-12 rounded-sm" />
        </span>
      </span>

      <span className="shimmer h-4 w-14 shrink-0 rounded-sm" />
    </div>
  );
}
