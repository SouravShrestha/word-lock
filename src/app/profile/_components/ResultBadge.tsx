import type { GameResult } from "@/lib/game/stats";

export function ResultBadge({ result }: { result: GameResult }) {
  const label = result === "win" ? "Win" : result === "loss" ? "Loss" : "Draw";
  const classes =
    result === "win"
      ? "bg-p2-soft text-p2"
      : result === "loss"
        ? "bg-p1-soft text-p1"
        : "bg-muted text-foreground";
  return (
    <span
      className={`rounded-[3px] ml-1 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}
