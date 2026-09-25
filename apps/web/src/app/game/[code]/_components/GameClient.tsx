"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

import { Tile, type TileOwner } from "@/components/Tile";
import {
  useSession,
  useHasPlayableAccount,
  createGameFn,
  fetchGameFn,
  joinGameFn,
  passTurnFn,
  submitMoveFn,
  destroyGameFn,
  forfeitGameFn,
  startGameFn,
  leaveLobbyFn,
  sendReactionFn,
  useMoveReview,
  useReactionFlash,
  useSweepTimer,
  useHostLeftCountdown,
  useInvalidateOnGameComplete,
} from "@word-lock/client";
import { supabase } from "@/integrations/supabase/client";
import { siteUrl } from "@/lib/app-meta";
import { type ReactionEmoji, type HistoryMove } from "@word-lock/core/game";
import { joinUrl } from "@word-lock/core/app";
import { Shell } from "./Shell";
import { WaitingLobby } from "./WaitingLobby";
import { ScoreBar } from "./ScoreBar";
import { ActionBar } from "./ActionBar";
import { GameOver } from "./GameOver";
import { PassConfirmDialog } from "./PassConfirmDialog";
import { ForfeitConfirmDialog } from "./ForfeitConfirmDialog";
import { PlayedWords } from "./PlayedWords";
import { WordPreview } from "./WordPreview";
import { GameBottomBar } from "./GameBottomBar";
import { ReviewBar } from "./ReviewBar";
import { GameMenuSheet } from "./GameMenuSheet";
import { EmojiReactionSheet } from "./EmojiReactionSheet";

const pendingDestroyTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function GameClient({ code }: { code: string }) {
  const roomCode = code.toUpperCase();
  const { sessionId, ready } = useSession();
  const canJoin = useHasPlayableAccount();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selection, setSelection] = useState<number[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { activeReaction, showReaction } = useReactionFlash();
  const { hostLeftCountdown, startHostLeftCountdown } = useHostLeftCountdown(() =>
    router.push("/"),
  );
  const viewerSlotRef = useRef<number | null>(null);
  const isHostWaitingRef = useRef(false);
  const isNonHostWaitingRef = useRef(false);

  const queryKey = useMemo(() => ["game", roomCode, sessionId], [roomCode, sessionId]);
  const { data: game, isLoading } = useQuery({
    queryKey,
    enabled: ready,
    queryFn: () => fetchGameFn({ sessionId: sessionId ?? undefined, roomCode }),
    refetchOnWindowFocus: true,
    refetchInterval: () => {
      if (!isRealtimeConnected) {
        return 3000;
      }
      return false;
    },
  });

  const historyMoves = useMemo<HistoryMove[]>(() => game?.history ?? [], [game?.history]);
  const gridLetters = useMemo<string[]>(() => game?.grid ?? [], [game?.grid]);
  const review = useMoveReview({
    grid: gridLetters,
    moves: historyMoves,
    playerOneId: game?.players.one?.id ?? null,
  });

  const isCompleted = game?.status === "completed";
  useInvalidateOnGameComplete(isCompleted, queryClient);

  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wl_games",
          filter: `id=eq.${game.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["game", roomCode, sessionId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wl_moves",
          filter: `game_id=eq.${game.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["game", roomCode, sessionId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "wl_games",
          filter: `id=eq.${game.id}`,
        },
        () => {
          startHostLeftCountdown();
        },
      )
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const emoji = payload?.emoji;
        const slot = payload?.slot;
        if (typeof emoji !== "string" || (slot !== 1 && slot !== 2)) return;
        if (slot === viewerSlotRef.current) return;
        showReaction(emoji, slot);
      })
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id, roomCode, sessionId, queryClient, showReaction]);

  useEffect(() => {
    isHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 1;
    isNonHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 2;
    viewerSlotRef.current = game?.viewerSlot ?? null;
  }, [game?.status, game?.viewerSlot]);

  useSweepTimer({
    status: game?.status,
    turnDeadline: game?.turnDeadline,
    sessionId,
    roomCode,
    queryClient,
    queryKey,
  });

  useEffect(() => {
    const pending = pendingDestroyTimers.get(roomCode);
    if (pending) {
      clearTimeout(pending);
      pendingDestroyTimers.delete(roomCode);
    }

    const handleUnload = () => {
      if (isHostWaitingRef.current && sessionId) {
        navigator.sendBeacon("/api/game/destroy", JSON.stringify({ roomCode, sessionId }));
      }
      if (isNonHostWaitingRef.current && sessionId) {
        navigator.sendBeacon("/api/game/leave", JSON.stringify({ roomCode, sessionId }));
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      if (isHostWaitingRef.current && sessionId) {
        pendingDestroyTimers.set(
          roomCode,
          setTimeout(() => {
            pendingDestroyTimers.delete(roomCode);
            fetch("/api/game/destroy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomCode, sessionId }),
              keepalive: true,
            }).catch(() => {});
          }, 300),
        );
      }
      if (isNonHostWaitingRef.current && sessionId) {
        fetch("/api/game/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, sessionId }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [roomCode, sessionId]);

  const moveMutation = useMutation({
    mutationFn: () =>
      submitMoveFn({
        sessionId: sessionId!,
        roomCode,
        word: selection.map((i) => game!.grid[i]).join(""),
        tileIndices: selection,
      }),
    onSuccess: () => {
      setSelection([]);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passMutation = useMutation({
    mutationFn: () => passTurnFn({ sessionId: sessionId!, roomCode }),
    onSuccess: () => {
      setSelection([]);
      toast("Turn passed.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinGameFn({ sessionId: sessionId!, roomCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error(error.message),
  });

  const forfeitMutation = useMutation({
    mutationFn: () => forfeitGameFn({ sessionId: sessionId!, roomCode }),
    onSuccess: () => {
      setShowForfeitConfirm(false);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      setShowForfeitConfirm(false);
      toast.error(error.message);
    },
  });

  const rematchMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId: sessionId! }),
    onSuccess: ({ roomCode: next }: { roomCode: string }) => router.push(`/game/${next}`),
    onError: (error: Error) => toast.error(error.message),
  });

  const sendReaction = (emoji: ReactionEmoji) => {
    setShowReactions(false);
    const slot = game?.viewerSlot;
    if (slot !== 1 && slot !== 2) return;
    showReaction(emoji, slot);
    sendReactionFn({ sessionId: sessionId!, roomCode, emoji }).catch((error: Error) =>
      toast.error(error.message),
    );
  };

  if (!ready || isLoading) {
    return (
      <main className="mx-auto h-dvh max-w-2xl px-5 py-8 flex items-center justify-center">
        <p className="text-foreground animate-pulse text-lg">Loading your board</p>
      </main>
    );
  }

  if (hostLeftCountdown !== null) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm p-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Host left the lobby</h2>
              <p className="mt-2 text-sm text-muted-foreground">The game has been disbanded</p>
            </div>
            <div className="text-6xl font-bold font-display tabular-nums text-foreground">
              {hostLeftCountdown}
            </div>
            <p className="text-sm text-muted-foreground">Redirecting to lobby...</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (!game) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl">No game with code {roomCode}</h2>
            <Link href="/" className="chunky-btn btn-primary mt-6 inline-block px-5 py-2.5">
              Back to lobby
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const viewerId =
    game.viewerSlot === 1
      ? game.players.one?.id
      : game.viewerSlot === 2
        ? game.players.two?.id
        : null;
  const isSpectator = game.viewerSlot === null;
  const yourTurn = !!viewerId && viewerId === game.currentTurnPlayerId && game.status === "active";
  const canPlay = yourTurn && !review.isReviewing;
  const origin = siteUrl();
  const shareUrl = origin ? joinUrl(origin, roomCode) : "";

  function toggleTile(index: number) {
    if (!canPlay) return;
    setSelection((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  if (game.status === "waiting") {
    // An invite link opened logged out renders this behind the login wall;
    // joining then would seat a nameless guest the host sees as "Player".
    if (
      isSpectator &&
      canJoin &&
      !joinMutation.isPending &&
      !joinMutation.isSuccess &&
      !joinMutation.isError
    ) {
      joinMutation.mutate();
    }

    return (
      <WaitingLobby
        roomCode={roomCode}
        game={game}
        isSpectator={isSpectator}
        joinPending={joinMutation.isPending}
        joinError={joinMutation.isError ? (joinMutation.error as Error)?.message : null}
        onDestroy={() => {
          isHostWaitingRef.current = false;
          router.push("/");
          destroyGameFn({ roomCode, sessionId: sessionId! }).catch(() => {});
        }}
        onStart={() =>
          startGameFn({ sessionId: sessionId!, roomCode }).then(() =>
            queryClient.invalidateQueries({ queryKey }),
          )
        }
        shareUrl={shareUrl}
        sessionId={sessionId}
        onLeave={() => {
          if (game.viewerSlot === 2 && sessionId) {
            isNonHostWaitingRef.current = false;
            leaveLobbyFn({ roomCode, sessionId }).catch(() => {});
          }
          router.push("/");
        }}
      />
    );
  }

  const p1IsActive = game.currentTurnPlayerId === game.players.one?.id;
  const p2IsActive = game.currentTurnPlayerId === game.players.two?.id;

  return (
    <Shell>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
        <PlayedWords game={game} />
        <ScoreBar
          game={game}
          p1Active={p1IsActive && game.status === "active"}
          p2Active={p2IsActive && game.status === "active"}
          reaction={activeReaction}
          scores={review.frame?.state.scores}
        />

        {game.status === "completed" && (
          <GameOver
            game={game}
            onExit={() => router.push("/")}
            onRematch={() => rematchMutation.mutate()}
            rematchPending={rematchMutation.isPending}
          />
        )}

        <div className="mx-auto w-full" style={{ maxWidth: "min(100%, calc(100dvh - 316px))" }}>
          <div className="grid w-full grid-cols-5 gap-0 border-border border-t border-l">
            {game.grid.map((letter: string, index: number) => {
              const owners = review.frame?.state.owners ?? game.owners;
              const locked = review.frame?.state.locked ?? game.locked;
              const highlighted = review.frame
                ? review.frame.claimed.indexOf(index)
                : selection.indexOf(index);

              return (
                <Tile
                  key={index}
                  letter={letter}
                  owner={owners[index] as TileOwner}
                  locked={locked[index]}
                  selected={highlighted !== -1}
                  order={highlighted !== -1 ? highlighted + 1 : null}
                  disabled={!canPlay}
                  onClick={() => toggleTile(index)}
                />
              );
            })}
          </div>
        </div>

        {review.frame ? (
          <ReviewBar
            frame={review.frame}
            moveCount={review.moveCount}
            isPlayerOne={review.frame.move.playerId === game.players.one?.id}
            onLive={review.goLive}
          />
        ) : (
          <WordPreview letters={selection.map((i) => game.grid[i])} yourTurn={yourTurn} />
        )}

        <ActionBar
          yourTurn={canPlay && !isSpectator}
          selectionLength={selection.length}
          onPass={() => setShowPassConfirm(true)}
          onClear={() => setSelection([])}
          onBackspace={() => setSelection((prev) => prev.slice(0, -1))}
          onSubmit={() => moveMutation.mutate()}
          passPending={passMutation.isPending}
          submitPending={moveMutation.isPending}
        />

        <GameBottomBar
          onOpenMenu={() => setShowMenu(true)}
          onOpenReactions={() => setShowReactions(true)}
          canReact={game.status === "active" && !isSpectator}
          onPrevMove={review.stepBack}
          onNextMove={review.stepForward}
          canPrevMove={review.canStepBack}
          canNextMove={review.canStepForward}
        />

        <GameMenuSheet
          open={showMenu}
          onClose={() => setShowMenu(false)}
          canForfeit={game.status === "active" && !isSpectator}
          onForfeit={() => setShowForfeitConfirm(true)}
        />

        <EmojiReactionSheet
          open={showReactions}
          onClose={() => setShowReactions(false)}
          onSelect={sendReaction}
        />

        {showPassConfirm && (
          <PassConfirmDialog
            onConfirm={() => {
              passMutation.mutate();
              setShowPassConfirm(false);
            }}
            onCancel={() => setShowPassConfirm(false)}
            isPending={passMutation.isPending}
          />
        )}

        {showForfeitConfirm && (
          <ForfeitConfirmDialog
            onConfirm={() => forfeitMutation.mutate()}
            onCancel={() => setShowForfeitConfirm(false)}
            isPending={forfeitMutation.isPending}
          />
        )}
      </div>
    </Shell>
  );
}
