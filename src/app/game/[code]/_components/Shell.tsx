import { Header } from "@/components/Header";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="dot-paper mx-auto h-[100dvh] overflow-hidden max-w-2xl px-3 pt-2 pb-2 flex flex-col">
      <Header compact />
      {children}
    </main>
  );
}
