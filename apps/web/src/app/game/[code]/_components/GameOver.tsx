"use client";

import { GameResultCard } from "@/components/GameResultCard";

export function GameOver({
  game,
  onExit,
  onRematch,
  rematchPending,
}: {
  game: any;
  onExit: () => void;
  onRematch?: () => void;
  rematchPending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <GameResultCard
        game={game}
        onExit={onExit}
        action={
          onRematch ? { label: "New Game", onClick: onRematch, pending: rematchPending } : null
        }
      />
    </div>
  );
}
