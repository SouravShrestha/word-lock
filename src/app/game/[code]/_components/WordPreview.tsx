/**
 * The word being built out of the current selection, or the prompt that tells
 * the player what to do with the grid below.
 */
export function WordPreview({ letters, yourTurn }: { letters: string[]; yourTurn: boolean }) {
  const word = letters.join("");
  return (
    <div className="bg-board flex h-12 w-full items-center justify-center px-4 py-3 rounded-xs">
      {word.length === 0 ? (
        <span className="select-none text-sm font-medium tracking-wide text-foreground/90">
          {yourTurn ? "Select tiles to form a word" : "Opponent's turn"}
        </span>
      ) : (
        <span className="font-display text-sm font-medium tracking-widest">{word}</span>
      )}
    </div>
  );
}
