export function PlayedWords({ game }: { game: any }) {
  if (game.playedWords.length === 0) return null;
  return (
    <div className="overflow-x-auto no-scrollbar">
      <ul className="flex gap-1.5">
        {[...game.playedWords].reverse().map((entry: any, i: number) => (
          <li
            key={i}
            className={`shrink-0 rounded-sm border-2 border-foreground px-2.5 py-1.5 text-xs font-bold ${
              entry.playerId === game.players.one?.id
                ? "bg-p1-soft text-p1-deep"
                : "bg-p2-soft text-p2-deep"
            }`}
          >
            {entry.word.charAt(0).toUpperCase() + entry.word.slice(1).toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
