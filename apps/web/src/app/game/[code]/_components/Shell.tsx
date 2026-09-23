export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col overflow-hidden px-3 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}
