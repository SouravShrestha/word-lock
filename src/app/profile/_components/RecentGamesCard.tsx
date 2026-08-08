import { formatDate } from "@/lib/game/format";
import type { RecentGameEntry } from "@/lib/game/stats";
import { ResultBadge } from "./ResultBadge";

export function RecentGamesCard({
  recentGames,
  onSelect,
}: {
  recentGames: RecentGameEntry[];
  onSelect: (entry: RecentGameEntry) => void;
}) {
  return (
    <section className="neo p-4">
      <h2 className="eyebrow text-xs text-muted-foreground mb-3">Recent games</h2>
      <ul className="flex flex-col gap-y-4">
        {recentGames.map((entry) => (
          <li key={entry.gameId}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className="w-full flex items-center justify-between rounded-md bg-transparent px-3 py-2 text-left transition-colors hover:bg-muted/70"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">vs {entry.opponentName}</p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {formatDate(entry.completedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-mono tabular-nums text-muted-foreground">
                  {entry.yourScore}-{entry.opponentScore}
                </span>
                <ResultBadge result={entry.result} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
