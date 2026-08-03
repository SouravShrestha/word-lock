export function WordPreview({ letters, yourTurn }: { letters: string[]; yourTurn: boolean }) {
  const word = letters.join("");
  return (
    <div className="neo bg-card w-full h-10 flex items-center justify-center px-4">
      {word.length === 0 ? (
        <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-semibold select-none">
          {yourTurn ? "Select tiles to form a word" : "Opponent's turn"}
        </span>
      ) : (
        <span className="text-base font-bold font-display tracking-widest">{word}</span>
      )}
    </div>
  );
}
