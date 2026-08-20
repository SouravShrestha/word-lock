"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

import { Tile, type TileOwner } from "@/components/Tile";
import { useSession } from "@/hooks/use-session";
import { useSound } from "@/hooks/use-sound";
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
} from "@/lib/game/api.client";
import { Shell } from "./Shell";
import { WaitingLobby } from "./WaitingLobby";
import { ScoreBar } from "./ScoreBar";
import { ActionBar } from "./ActionBar";
import { GameOver } from "./GameOver";
import { PassConfirmDialog } from "./PassConfirmDialog";
import { ForfeitConfirmDialog } from "./ForfeitConfirmDialog";
import { PlayedWords } from "./PlayedWords";
import { WordPreview } from "./WordPreview";

export function GameClient({ code }: { code: string }) {
  const roomCode = code.toUpperCase();
  const { sessionId, displayName, isNameSet, ready } = useSession();
  const { play } = useSound();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selection, setSelection] = useState<number[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [, setTick] = useState(0);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [hostLeftCountdown, setHostLeftCountdown] = useState<number | null>(null);
  const isHostWaitingRef = useRef(false);
  const isNonHostWaitingRef = useRef(false);
  const prevLockedRef = useRef<boolean[] | null>(null);
  const prevHistoryCountRef = useRef<number | null>(null);
  const prevYourTurnRef = useRef<boolean | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevOpponentJoinedRef = useRef<boolean | null>(null);

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

  // The viewer's own player id, resolved from their seat in this game.
  const viewerId = useMemo(() => {
    if (!game) return null;
    if (game.viewerSlot === 1) return game.players.one?.id ?? null;
    if (game.viewerSlot === 2) return game.players.two?.id ?? null;
    return null;
  }, [game]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
      .subscribe((status, err) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id, roomCode, sessionId, queryClient]);

  useEffect(() => {
    isHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 1;
    isNonHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 2;
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

  // Sound: tile locking. Diff the locked array between renders and play a
  // "lock" sound whenever a previously-unlocked tile becomes locked.
  useEffect(() => {
    if (!game?.locked) return;
    const prev = prevLockedRef.current;
    if (prev) {
      const newlyLocked = game.locked.some((locked: boolean, i: number) => locked && !prev[i]);
      if (newlyLocked) play("lock");
    }
    prevLockedRef.current = game.locked;
  }, [game?.locked, play]);

  // Sound: opponent's move landing. Realtime only invalidates the query, so
  // the only way to notice the opponent played is to diff the move history.
  // The first observation just seeds the ref, otherwise loading into an
  // in-progress game would fire for moves that happened before we arrived.
  useEffect(() => {
    if (!game?.history) return;
    const prevCount = prevHistoryCountRef.current;
    prevHistoryCountRef.current = game.history.length;
    if (prevCount === null || game.history.length <= prevCount) return;

    // Only the moves we haven't seen yet, and only the opponent's.
    const fresh = game.history.slice(prevCount);
    const opponentMove = [...fresh].reverse().find((m) => m.playerId !== viewerId);
    if (!opponentMove) return;
    play(opponentMove.passed ? "pass" : "success");
  }, [game?.history, viewerId, play]);

  // Sound: "your turn" notification. Fires only on the false -> true edge so
  // it doesn't replay on every unrelated refetch.
  useEffect(() => {
    if (!game) return;
    const isYourTurn =
      !!viewerId && viewerId === game.currentTurnPlayerId && game.status === "active";
    const prev = prevYourTurnRef.current;
    prevYourTurnRef.current = isYourTurn;
    if (prev === false && isYourTurn) play("your-turn");
  }, [game, viewerId, play]);

  // Sound: opponent joins the lobby.
  useEffect(() => {
    if (!game || game.status !== "waiting") return;
    const opponentJoined = !!game.players.two;
    if (prevOpponentJoinedRef.current === false && opponentJoined) play("opponent-joined");
    prevOpponentJoinedRef.current = opponentJoined;
  }, [game, play]);

  // Sound: game start / game over transitions.
  useEffect(() => {
    if (!game) return;
    const prevStatus = prevStatusRef.current;
    if (prevStatus === "waiting" && game.status === "active") {
      play("game-start");
    } else if (prevStatus === "active" && game.status === "completed") {
      if (!game.winnerId) play("draw");
      else if (viewerId && game.winnerId === viewerId) play("win");
      else play("lose");
    }
    prevStatusRef.current = game.status;
  }, [game, viewerId, play]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as any;
      win.pendingDestroys = win.pendingDestroys || {};
      if (win.pendingDestroys[roomCode]) {
        clearTimeout(win.pendingDestroys[roomCode]);
        delete win.pendingDestroys[roomCode];
      }
    }

    const handleBeforeUnload = () => {
      if (isHostWaitingRef.current && sessionId) {
        navigator.sendBeacon("/api/game/destroy", JSON.stringify({ roomCode, sessionId }));
      }
      if (isNonHostWaitingRef.current && sessionId) {
        navigator.sendBeacon("/api/game/leave", JSON.stringify({ roomCode, sessionId }));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (isHostWaitingRef.current && sessionId) {
        if (typeof window !== "undefined") {
          const win = window as any;
          win.pendingDestroys = win.pendingDestroys || {};
          win.pendingDestroys[roomCode] = setTimeout(() => {
            fetch("/api/game/destroy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomCode, sessionId }),
              keepalive: true,
            }).catch(() => {});
          }, 300);
        }
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
      play("success");
      setSelection([]);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      play("error");
      toast.error(error.message);
    },
  });

  const passMutation = useMutation({
    mutationFn: () => passTurnFn({ sessionId: sessionId!, roomCode }),
    onSuccess: () => {
      play("pass");
      setSelection([]);
      toast("Turn passed.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinGameFn({ sessionId: sessionId!, roomCode, displayName }),
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

  if (!ready || isLoading || !isNameSet) {
    return (
      <main className="dot-paper mx-auto h-dvh max-w-2xl px-5 py-8 flex items-center justify-center">
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
            <Link
              href="/"
              className="chunky-btn mt-6 inline-block bg-primary px-5 py-2.5 text-primary-foreground"
            >
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
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/game/${roomCode}` : "";

  function toggleTile(index: number) {
    if (!yourTurn) return;
    // Tile press sound (key.mp3) is handled globally via data-sound="key" on <Tile>.
    setSelection((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  if (game.status === "waiting") {
    // Auto-join if we haven't been assigned a slot yet
    if (
      isSpectator &&
      isNameSet &&
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
      <div className="flex flex-1 flex-col justify-between min-h-0">
        <ScoreBar
          game={game}
          p1Active={p1IsActive && game.status === "active"}
          p2Active={p2IsActive && game.status === "active"}
          yourTurn={yourTurn}
          isSpectator={isSpectator}
          viewerSlot={game.viewerSlot}
          canForfeit={game.status === "active" && !isSpectator}
          onForfeit={() => setShowForfeitConfirm(true)}
        />

        <PlayedWords game={game} />

        {game.status === "completed" && <GameOver game={game} onNew={() => router.push("/")} />}

        <WordPreview letters={selection.map((i) => game.grid[i])} yourTurn={yourTurn} />

        {/* Grid: constrained so tiles don't grow too large on wide screens */}
        <div className="mx-auto w-full" style={{ maxWidth: "min(100%, calc(100dvh - 360px))" }}>
          <div className="grid grid-cols-5 gap-1 w-full">
            {game.grid.map((letter: string, index: number) => (
              <Tile
                key={index}
                letter={letter}
                owner={game.owners[index] as TileOwner}
                locked={game.locked[index]}
                selected={selection.includes(index)}
                order={selection.includes(index) ? selection.indexOf(index) + 1 : null}
                disabled={!yourTurn}
                onClick={() => toggleTile(index)}
              />
            ))}
          </div>
        </div>

        {game.status === "active" && !isSpectator && (
          <ActionBar
            yourTurn={yourTurn}
            selectionLength={selection.length}
            onPass={() => setShowPassConfirm(true)}
            onClear={() => setSelection([])}
            onBackspace={() => setSelection((prev) => prev.slice(0, -1))}
            onSubmit={() => moveMutation.mutate()}
            passPending={passMutation.isPending}
            submitPending={moveMutation.isPending}
          />
        )}

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
