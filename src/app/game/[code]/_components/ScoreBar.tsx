import { timeLeftLabel } from "@/lib/game/format";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { QuitIcon } from "@/components/icons/QuitIcon";

export function ScoreBar({
  game,
  p1Active,
  p2Active,
  yourTurn,
  isSpectator,
  viewerSlot,
  canForfeit,
  onForfeit,
}: {
  game: any;
  p1Active: boolean;
  p2Active: boolean;
  yourTurn: boolean;
  isSpectator: boolean;
  viewerSlot: number | null;
  canForfeit: boolean;
  onForfeit: () => void;
}) {
  const timerLabel = game.status === "active" ? timeLeftLabel(game.turnDeadline) : null;

  return (
    <div className="py-2">
      {/* Top row: P1 | Timer | P2 */}
      <div className="flex gap-1.5 items-stretch justify-around">
        {/* Player 1 */}
        <div
          className={`w-24 shrink-0 flex flex-col items-center justify-center rounded-sm px-2 py-1.5 transition-all duration-200 ${
            p1Active ? "bg-p1-soft ring-2 ring-p1" : "bg-transparent"
          }`}
        >
          <p className="text-xs font-bold text-p1 truncate max-w-full text-center leading-none mb-2">
            {game.players.one?.name ?? "-"}
          </p>
          <p className="text-2xl font-bold font-display leading-none">{game.scores[1]}</p>
        </div>

        {/* Centre: timer + quit */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
          <div className="neo bg-card w-32 flex items-center justify-center gap-1.5 px-3 py-1.5">
            <ClockIcon className="w-3.5 h-3.5 shrink-0 translate-y-px" />
            <p className="text-xs font-bold font-display tabular-nums tracking-wide leading-none">
              {timerLabel ?? (game.status === "completed" ? "Game over" : "-")}
            </p>
          </div>
          <button
            onClick={onForfeit}
            disabled={!canForfeit}
            className="chunky-btn flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground font-semibold text-xs px-3 py-1.5 disabled:bg-muted disabled:text-muted-foreground disabled:border-muted-foreground w-32"
            aria-label="Quit game"
          >
            <QuitIcon className="w-3.5 h-3.5 shrink-0" />
            Quit game
          </button>
        </div>

        {/* Player 2 */}
        <div
          className={`w-24 shrink-0 flex flex-col items-center justify-center rounded-sm px-2 py-1.5 transition-all duration-200 ${
            p2Active ? "bg-p2-soft ring-2 ring-p2" : "bg-transparent"
          }`}
        >
          <p className="text-xs font-bold text-p2 truncate max-w-full text-center leading-none mb-2">
            {game.players.two?.name ?? "-"}
          </p>
          <p className="text-2xl font-bold font-display leading-none">{game.scores[2]}</p>
        </div>
      </div>
    </div>
  );
}
