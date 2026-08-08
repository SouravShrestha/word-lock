import type { StatsOverview } from "@/lib/game/stats";

export function OverviewCard({
  overview,
  winRate,
}: {
  overview: StatsOverview;
  winRate: number | null;
}) {
  return (
    <section className="neo p-4">
      <h2 className="eyebrow text-xs text-muted-foreground mb-3">Overall record</h2>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Wins" value={overview.wins} accent="text-p2" />
        <Stat label="Losses" value={overview.losses} accent="text-p1" />
        <Stat label="Draws" value={overview.draws} accent="text-foreground" />
        <Stat
          label="Win %"
          value={winRate === null ? "—" : `${winRate}%`}
          accent="text-foreground"
        />
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-display text-2xl font-bold ${accent}`}>{value}</span>
      <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}
