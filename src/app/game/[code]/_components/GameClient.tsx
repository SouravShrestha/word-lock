"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

import { Tile, type TileOwner } from "@/components/Tile";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchGameFn,
  joinGameFn,
  passTurnFn,
  submitMoveFn,
  destroyGameFn,
  forfeitGameFn,
  timeoutGameFn,
  startGameFn,
  leaveLobbyFn,
  sendReactionFn,
} from "@/lib/game/api.client";
import type { ReactionEmoji } from "@/lib/game/reactions";
import type { HistoryMove } from "@/lib/game/review";
import { useMoveReview } from "@/hooks/use-move-review";
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

/**
 * Debounces the "destroy the lobby I was hosting" beacon across a transient
 * unmount — a StrictMode double-invoke or a quick back-navigation that lands
 * right back on the same room shouldn't tear down a game the player never
 * actually left.
 *
 * Module-level rather than component state on purpose: the whole point is to
 * survive this component unmounting, which local state cannot do. Previously
 * this lived on `window as any`, an untyped global any script on the page
 * could stomp on; a module-level `Map` gets the same cross-mount lifetime
 * without leaking onto `window` at all.
 */
const pendingDestroyTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function GameClient({ code }: { code: string }) {
  const roomCode = code.toUpperCase();
  const { sessionId, ready } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selection, setSelection] = useState<number[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [hostLeftCountdown, setHostLeftCountdown] = useState<number | null>(null);
  /*
   * The reaction currently on screen, with the slot it belongs to — a reaction
   * lands on the face of the player who sent it, so both screens show the same
   * emoji over the same avatar and the gesture reads as that player speaking.
   * Keyed so a second reaction before the fade-out timer fires still restarts
   * the animation instead of being swallowed by React bailing out on an
   * identical state update.
   */
  const [activeReaction, setActiveReaction] = useState<{
    key: number;
    emoji: string;
    slot: 1 | 2;
  } | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /*
   * Read inside the realtime callback to drop the echo of the viewer's own
   * reaction. Held in a ref rather than closed over so the channel is not torn
   * down and resubscribed when the viewer is assigned a seat.
   */
  const viewerSlotRef = useRef<number | null>(null);
  const isHostWaitingRef = useRef(false);
  const isNonHostWaitingRef = useRef(false);

  /**
   * Puts an emoji on a player's face for a beat.
   *
   * `senderSlot` is the seat that sent it, which is the face it appears on.
   *
   * Keyed by time so a second reaction landing before the timer fires restarts
   * the animation rather than being swallowed as an identical state update.
   */
  const showReaction = useCallback((emoji: string, senderSlot: 1 | 2) => {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    setActiveReaction({ key: Date.now(), emoji, slot: senderSlot });
    reactionTimerRef.current = setTimeout(() => setActiveReaction(null), 2000);
  }, []);

  const queryKey = useMemo(() => ["game", roomCode, sessionId], [roomCode, sessionId]);
  const { data: game, isLoading } = useQuery({
    queryKey,
    enabled: ready,
    queryFn: () => fetchGameFn({ sessionId: sessionId ?? undefined, roomCode }),
    refetchOnWindowFocus: true,
    // Polling fallback configuration
    refetchInterval: (query) => {
      // Fast polling only if realtime is physically disconnected
      if (!isRealtimeConnected) {
        return 3000;
      }
      return false;
    },
  });

  /*
   * Move review. Memoised on the query data so the hook's replay is not redone
   * on every render — this component re-renders often (mutations, the
   * realtime subscription, tile selection), and `?? []` would hand it a fresh
   * array each time.
   */
  const historyMoves = useMemo<HistoryMove[]>(() => game?.history ?? [], [game?.history]);
  const gridLetters = useMemo<string[]>(() => game?.grid ?? [], [game?.grid]);
  const review = useMoveReview({
    grid: gridLetters,
    moves: historyMoves,
    playerOneId: game?.players.one?.id ?? null,
  });

  /*
   * Stars move server-side the moment a game completes, so the cached account
   * summary and leaderboard are stale as soon as the final move lands. Both are
   * refreshed here: the end-of-game screen works the player's previous league
   * out from their current star count, and the star pill is waiting for them
   * back in the lobby.
   */
  const isCompleted = game?.status === "completed";
  useEffect(() => {
    if (!isCompleted) return;
    queryClient.invalidateQueries({ queryKey: ["account"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }, [isCompleted, queryClient]);

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
          setHostLeftCountdown(5);
        },
      )
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const emoji = payload?.emoji;
        const slot = payload?.slot;
        if (typeof emoji !== "string" || (slot !== 1 && slot !== 2)) return;
        /*
         * The sender already drew this one the instant it was tapped, so the
         * round trip coming back would restart the animation a few hundred
         * milliseconds in and read as a stutter.
         */
        if (slot === viewerSlotRef.current) return;
        // The payload carries the sender's seat, which is the face it lands on.
        showReaction(emoji, slot);
      })
      .subscribe((status, err) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    };
  }, [game?.id, roomCode, sessionId, queryClient, showReaction]);

  useEffect(() => {
    isHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 1;
    isNonHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 2;
    viewerSlotRef.current = game?.viewerSlot ?? null;
  }, [game?.status, game?.viewerSlot]);

  // Countdown timer for host left
  useEffect(() => {
    if (hostLeftCountdown === null) return;

    if (hostLeftCountdown === 0) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      setHostLeftCountdown(hostLeftCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [hostLeftCountdown, router]);

  useEffect(() => {
    if (game?.status !== "active" || !game.turnDeadline) return;

    const msLeft = new Date(game.turnDeadline).getTime() - Date.now();

    const triggerSweep = () => {
      if (!sessionId) return;
      timeoutGameFn({ sessionId, roomCode })
        .then(() => queryClient.invalidateQueries({ queryKey }))
        .catch(console.error);
    };

    if (msLeft <= 0) {
      triggerSweep();
      return;
    }

    const timer = setTimeout(triggerSweep, msLeft);
    return () => clearTimeout(timer);
  }, [game?.turnDeadline, game?.status, queryClient, queryKey, sessionId, roomCode]);

  useEffect(() => {
    const pending = pendingDestroyTimers.get(roomCode);
    if (pending) {
      clearTimeout(pending);
      pendingDestroyTimers.delete(roomCode);
    }

    /*
     * `beforeunload` alone misses real departures on iOS Safari — it is
     * unreliable there for tab close, swipe-away and backgrounding, which is
     * exactly how this game gets left on a phone. `pagehide` fires
     * consistently across desktop and mobile for all of those, so both
     * listeners call the same handler; a real close firing the beacon twice
     * is harmless since `destroy`/`leave` are both idempotent no-ops on a
     * second call.
     */
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

  /**
   * Sends a reaction, drawing it locally first.
   *
   * Deliberately not a `useMutation`: a reaction is a throwaway gesture with
   * nothing to invalidate, and every mutation in flight drives the global
   * NProgress bar in `QueryProvider`. A progress bar across the top of the
   * screen for an emoji would be louder than the emoji.
   *
   * So the request is fired and not awaited. The sender sees the emoji on the
   * same tap, the opponent sees it when the broadcast reaches them, and a
   * failure is reported after the fact rather than held up front — there is
   * nothing to roll back either way.
   */
  const sendReaction = (emoji: ReactionEmoji) => {
    setShowReactions(false);
    const slot = game?.viewerSlot;
    if (slot !== 1 && slot !== 2) return;
    showReaction(emoji, slot);
    sendReactionFn({ sessionId: sessionId!, roomCode, emoji }).catch((error: Error) =>
      toast.error(error.message),
    );
  };

  /*
   * No name gate here any more. The board used to be held back until a local
   * display name existed, because joining carried that name up with it. Joining
   * carries no name now, and the login wall plus the username sheet already sit
   * above this screen until the player has one.
   */
  if (!ready || isLoading) {
    return (
      <main className="mx-auto h-dvh max-w-2xl px-5 py-8 flex items-center justify-center">
        <p className="text-foreground animate-pulse text-lg">Loading your board</p>
      </main>
    );
  }

  // Show countdown if host left
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
  /*
   * A past turn is a read-only view: the board it shows is not the one a move
   * would land on, so the grid takes no taps and the action bar goes quiet until
   * the player returns to live. The turn itself is not given up — the selection
   * they had is still there when they come back.
   */
  const canPlay = yourTurn && !review.isReviewing;
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/game/${roomCode}` : "";

  function toggleTile(index: number) {
    if (!canPlay) return;
    setSelection((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  if (game.status === "waiting") {
    // Auto-join if we haven't been assigned a slot yet. No longer waits on a
    // local name: the join payload carries none, and the player's username is
    // already on their row by the time they can reach a room link.
    if (
      isSpectator &&
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

        {game.status === "completed" && <GameOver game={game} onNew={() => router.push("/")} />}

        {/* Grid: constrained so tiles don't grow too large on wide screens. The
            subtrahend is the combined height of everything else in this column,
            so it moves whenever the panels above or below change size. */}
        <div className="mx-auto w-full" style={{ maxWidth: "min(100%, calc(100dvh - 316px))" }}>
          <div className="grid w-full grid-cols-5 gap-0 border-border border-t border-l">
            {game.grid.map((letter: string, index: number) => {
              /*
               * While a past turn is on screen the owners and locks come from the
               * replayed frame, and the highlight is the word that turn played
               * rather than the viewer's selection — the accent means "the word
               * in question" in both modes.
               */
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

        {/* One seat, two occupants: the review panel takes the preview's place and
            its exact height, so walking the history never resizes the grid. */}
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

        {/*
          Always rendered, disabled when it is not the viewer's turn. Unmounting
          it for a spectator or between turns would resize the grid underneath
          the player, so the controls stay put and go quiet instead.
        */}
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
