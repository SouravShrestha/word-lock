"use client";

import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { fetchGameFn } from "@/lib/game/api.client";
import type { RecentGameEntry } from "@/lib/game/stats";
import { GameDetailContent } from "./GameDetailContent";

export function GameDetailPopup({
  entry,
  sessionId,
  onClose,
}: {
  entry: RecentGameEntry;
  sessionId: string;
  onClose: () => void;
}) {
  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game-detail", entry.roomCode],
    queryFn: () => fetchGameFn({ sessionId, roomCode: entry.roomCode }),
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="neo bg-card w-full max-w-sm p-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <CrossIcon className="w-5 h-5" />
        </button>

        {isLoading && (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading game…</div>
        )}

        {error && (
          <div className="py-10 text-center text-sm text-destructive">
            {error.message || "Failed to load game"}
          </div>
        )}

        {!isLoading && !error && game && <GameDetailContent game={game} />}
      </div>
    </div>
  );
}
