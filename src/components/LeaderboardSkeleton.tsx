/**
 * Shimmer stand-ins for the leaderboard rows while the league query is in
 * flight. Mirrors {@link Row}'s shape (rank, name, star pill) so the list
 * doesn't jump when the real entries arrive. Corners are less rounded (`xs`)
 * than the shimmer default to match the rank/star-pill glyphs they stand in for.
 */
export function LeaderboardSkeleton() {
  return (
    <ul aria-hidden className="flex flex-col gap-2.5">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <LeaderboardRowSkeleton />
        </li>
      ))}
    </ul>
  );
}

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 pl-5 pr-6 py-6 -mx-5">
      <span className="shimmer h-4 w-5 shrink-0 rounded-xs" />

      <span className="shimmer h-4 w-32 min-w-0 flex-1 rounded-xs" />

      <span className="shimmer h-6 w-14 shrink-0 rounded-xs" />
    </div>
  );
}
