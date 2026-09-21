/**
 * The board's frame. The back button used to live here, in a strip of its own;
 * it now sits inside the scoreboard panel, so the shell is just the viewport
 * box and its gutters.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col overflow-hidden px-3 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}
