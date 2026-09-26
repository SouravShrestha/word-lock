"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { GameResultCard } from "@/components/GameResultCard";
import { createGameFn, fetchGameFn } from "@word-lock/client";
import type { RecentGameEntry } from "@word-lock/core/game";

/**
 * A finished game from the record, opened from a history row or the profile's
 * recent list.
 *
 * The body is `GameResultCard` — the same component the end-of-game screen uses,
 * so a game looks the same the moment it ends and a month later, down to the
 * "New Game" button: reading an old result is the same itch to play again as
 * finishing one, so it opens a fresh room exactly as the end-of-game screen does.
 *
 * Exit is the card's own button rather than a corner cross: this is a result to
 * be read and left, not a panel layered over something the player was doing.
 */
export function GameDetailPopup({
  entry,
  sessionId,
  onClose,
}: {
  entry: RecentGameEntry;
  sessionId: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game-detail", entry.roomCode],
    queryFn: () => fetchGameFn({ sessionId, roomCode: entry.roomCode }),
  });

  /*
   * A new game, not a replay of this one: the same create-and-go the end-of-game
   * screen runs. The old game is left untouched in the record, and the fresh
   * lobby is where the invite link for the next opponent comes from — nobody is
   * seated automatically, since a game closed weeks ago has no channel left to
   * tell the other side about it.
   */
  const newGameMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId }),
    onSuccess: ({ roomCode }: { roomCode: string }) => {
      onClose();
      router.push(`/game/${roomCode}`);
    },
    onError: (error: Error) => toast.error(error.message),
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {isLoading && (
        <div className="w-full max-w-sm p-5 text-center text-base text-muted-foreground">
          Loading game
        </div>
      )}

      {error && (
        <div className="neo bg-card w-full max-w-sm p-5 text-center text-sm text-destructive">
          {error.message || "Failed to load game"}
        </div>
      )}

      {!isLoading && !error && game && (
        <GameResultCard
          game={game}
          onExit={onClose}
          action={{
            label: "New Game",
            onClick: () => newGameMutation.mutate(),
            pending: newGameMutation.isPending,
          }}
        />
      )}
    </div>
  );
}
