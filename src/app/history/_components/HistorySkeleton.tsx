import { cn } from "@/lib/utils";

/**
 * Shimmer stand-ins for the match list while the profile query is in
 * flight. The headline renders statically (no shimmer) since its text is
 * static regardless of loading state; the list rows below mirror the real
 * row's shape so the page doesn't jump when the data arrives.
 */
export function HistorySkeleton() {
  return (
    <div aria-hidden>
      <header className="pt-8">
        <h1 className="font-display text-3xl font-bold">Your matches</h1>
      </header>

      <span className="shimmer mt-7 inline-block h-4 w-28 rounded-xs" />

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
        <span className="shimmer block h-4 w-28 rounded-xs" />
        <span className={cn("mt-2 flex items-center gap-3")}>
          <span className="shimmer h-3 w-16 rounded-xs" />
          <span className="shimmer h-3 w-12 rounded-xs" />
        </span>
      </span>

      <span className="shimmer h-4 w-14 shrink-0 rounded-xs" />
    </div>
  );
}
