export function PlayedWords({ game }: { game: any }) {
  return (
    <div className="neo bg-board overflow-x-auto no-scrollbar rounded-none -mx-3 py-2 md:-mt-2">
      <ul className="flex h-4 items-center gap-7 px-5 w-max">
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
