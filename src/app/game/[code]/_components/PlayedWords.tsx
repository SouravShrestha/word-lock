/**
 * The words played so far, newest first, in the colour of whoever played them.
 *
 * The strip keeps its height when the board is still empty rather than
 * unmounting: it sits between the scoreboard and the word preview, and a panel
 * that appears on the first move would shunt the grid down under the player's
 * thumb mid-game.
 */
export function PlayedWords({ game }: { game: any }) {
  return (
    <div className="neo bg-board overflow-x-auto no-scrollbar rounded-none -mx-3 px-5 py-2 md:-mt-2">
      <ul className="flex h-4 items-center gap-4">
        {[...game.playedWords].reverse().map((entry: any, i: number) => (
          <li
            key={i}
            className={`shrink-0 text-sm font-regular leading-none ${
              entry.playerId === game.players.one?.id ? "text-p1" : "text-p2"
            }`}
          >
            {entry.word.charAt(0).toUpperCase() + entry.word.slice(1).toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
