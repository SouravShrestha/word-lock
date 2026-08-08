import { CelebrateIcon } from "@/components/icons/CelebrateIcon";
import { Tile, type TileOwner } from "@/components/Tile";
import type { SerializedGame } from "@/lib/game/service.server";
// Type-only import: `service.server.ts` is a server-only module, but since this
// is a type (erased at compile time) no server runtime code is bundled here.

export function GameDetailContent({ game }: { game: SerializedGame }) {
  const p1 = game.players.one;
  const p2 = game.players.two;

  const winner = game.winnerId === p1?.id ? p1 : game.winnerId === p2?.id ? p2 : null;
  const isDraw = !winner;

  let reasonLabel: string;
  if (game.endReason === "forfeit") {
    reasonLabel = "Opponent left the game";
  } else if (game.endReason === "double-pass") {
    reasonLabel = "Both players passed";
  } else {
    reasonLabel = "Board filled";
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mb-4">
        <CelebrateIcon className="w-8 h-8" />
        <h2 className="text-xl font-bold font-display text-center">
          {isDraw ? "It's a draw!" : `${winner!.name} wins!`}
        </h2>
        <span className="text-sm text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
          {reasonLabel}
        </span>
      </div>

      {/* Score breakdown */}
      <div className="flex items-center justify-between gap-0 mb-4 w-full">
        {/* P1 */}
        <div
          className={`flex-1 flex flex-col items-center justify-center rounded-sm px-3 py-2.5 gap-1 max-w-1/3 ${
            game.winnerId === p1?.id ? "bg-p1-soft ring-2 ring-p1" : "bg-muted/40"
          }`}
        >
          <p className="text-xs font-semibold text-p1 truncate max-w-full text-center leading-none">
            {p1?.name ?? "Player 1"}
          </p>
          <p className="text-3xl font-bold font-display leading-none">{game.scores[1]}</p>
          {game.winnerId === p1?.id && (
            <span className="text-[10px] font-bold text-p1 uppercase tracking-wider">winner</span>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center text-lg font-bold text-muted-foreground max-w-1/3">
          vs
        </div>

        {/* P2 */}
        <div
          className={`max-w-1/3 flex-1 flex flex-col items-center justify-center rounded-sm px-3 py-2.5 gap-1 ${
            game.winnerId === p2?.id ? "bg-p2-soft ring-2 ring-p2" : "bg-muted/40"
          }`}
        >
          <p className="text-xs font-semibold text-p2 truncate max-w-full text-center leading-none">
            {p2?.name ?? "Player 2"}
          </p>
          <p className="text-3xl font-bold font-display leading-none">{game.scores[2]}</p>
          {game.winnerId === p2?.id && (
            <span className="text-[10px] font-bold text-p2 uppercase tracking-wider">winner</span>
          )}
        </div>
      </div>

      {/* Board snapshot */}
      <div className="w-full">
        <div className="grid grid-cols-5 gap-0.5 w-full">
          {game.grid.map((letter, index) => (
            <Tile
              key={index}
              letter={letter}
              owner={game.owners[index] as TileOwner}
              locked={game.locked[index]}
              disabled
            />
          ))}
        </div>
      </div>
    </>
  );
}
