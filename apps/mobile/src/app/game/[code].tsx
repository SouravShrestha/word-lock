import {
  createGameFn,
  destroyGameFn,
  fetchGameFn,
  forfeitGameFn,
  joinGameFn,
  leaveLobbyFn,
  passTurnFn,
  sendReactionFn,
  startGameFn,
  submitMoveFn,
  useHostLeftCountdown,
  useInvalidateOnGameComplete,
  useMoveReview,
  useReactionFlash,
  useSession,
  useSweepTimer,
} from "@word-lock/client";
import { joinUrl } from "@word-lock/core/app";
import { type ReactionEmoji, type HistoryMove } from "@word-lock/core/game";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Text, View, type AppStateStatus } from "react-native";

import { supabase } from "@/lib/supabase";

import { ActionBar } from "@/components/ActionBar";
import { BoardGrid } from "@/components/BoardGrid";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmojiReactionSheet } from "@/components/EmojiReactionSheet";
import { GameBottomBar } from "@/components/GameBottomBar";
import { GameMenuSheet } from "@/components/GameMenuSheet";
import { GameOver } from "@/components/GameOver";
import { PlayedWords } from "@/components/PlayedWords";
import { ReviewBar } from "@/components/ReviewBar";
import { ScoreBar } from "@/components/ScoreBar";
import { Shell } from "@/components/Shell";
import { WaitingLobby, type WaitingGame } from "@/components/WaitingLobby";
import { WordPreview } from "@/components/WordPreview";
import { toast } from "@/components/Toast";
import { siteUrl } from "@/lib/app-meta";
import type { TileOwner } from "@/components/Tile";

const pendingDestroyTimers = new Map<string, ReturnType<typeof setTimeout>>();

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const roomCode = code?.toUpperCase() ?? "";
  const { sessionId, ready } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { activeReaction, showReaction } = useReactionFlash();
  const { hostLeftCountdown, startHostLeftCountdown } = useHostLeftCountdown(() =>
    router.push("/"),
  );

  const queryKey = useMemo(() => ["game", roomCode, sessionId], [roomCode, sessionId]);

  const { data: game, isLoading } = useQuery({
    queryKey,
    enabled: ready && !!roomCode,
    queryFn: () => fetchGameFn({ sessionId: sessionId ?? undefined, roomCode }),
    refetchInterval: isRealtimeConnected ? false : 3000,
  });

  const isSpectator = game?.viewerSlot == null;

  const joinMutation = useMutation({
    mutationFn: () => joinGameFn({ sessionId: sessionId!, roomCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const hasAttemptedJoin = useRef(false);
  useEffect(() => {
    if (
      game?.status === "waiting" &&
      isSpectator &&
      ready &&
      sessionId &&
      !hasAttemptedJoin.current
    ) {
      hasAttemptedJoin.current = true;
      joinMutation.mutate();
    }
  }, [game?.status, isSpectator, ready, sessionId, joinMutation]);

  const viewerSlotRef = useRef<number | null>(null);
  const isHostWaitingRef = useRef(false);
  const isNonHostWaitingRef = useRef(false);

  useEffect(() => {
    isHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 1;
    isNonHostWaitingRef.current = game?.status === "waiting" && game?.viewerSlot === 2;
    viewerSlotRef.current = game?.viewerSlot ?? null;
  }, [game?.status, game?.viewerSlot]);

  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wl_games", filter: `id=eq.${game.id}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wl_moves", filter: `game_id=eq.${game.id}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "wl_games", filter: `id=eq.${game.id}` },
        () => startHostLeftCountdown(),
      )
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const emoji = payload?.emoji;
        const slot = payload?.slot;
        if (typeof emoji !== "string" || (slot !== 1 && slot !== 2)) return;
        if (slot === viewerSlotRef.current) return;
        showReaction(emoji, slot);
      })
      .subscribe((status) => setIsRealtimeConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id, queryClient, queryKey, showReaction]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        queryClient.invalidateQueries({ queryKey });
        return;
      }
      if (isHostWaitingRef.current && sessionId) {
        destroyGameFn({ roomCode, sessionId }).catch(() => {});
      }
      if (isNonHostWaitingRef.current && sessionId) {
        leaveLobbyFn({ roomCode, sessionId }).catch(() => {});
      }
    };

    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  }, [queryClient, queryKey, roomCode, sessionId]);

  useEffect(() => {
    const pending = pendingDestroyTimers.get(roomCode);
    if (pending) {
      clearTimeout(pending);
      pendingDestroyTimers.delete(roomCode);
    }

    return () => {
      if (isHostWaitingRef.current && sessionId) {
        pendingDestroyTimers.set(
          roomCode,
          setTimeout(() => {
            pendingDestroyTimers.delete(roomCode);
            destroyGameFn({ roomCode, sessionId }).catch(() => {});
          }, 300),
        );
      }
      if (isNonHostWaitingRef.current && sessionId) {
        leaveLobbyFn({ roomCode, sessionId }).catch(() => {});
      }
    };
  }, [roomCode, sessionId]);

  if (hostLeftCountdown !== null) {
    return (
      <Shell>
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <View className="items-center">
            <Text className="text-2xl font-bold text-foreground">Host left the lobby</Text>
            <Text className="font-sans mt-2 text-sm text-mutedForeground">
              The game has been disbanded
            </Text>
          </View>
          <Text className="font-display text-6xl font-bold tabular-nums text-foreground">
            {hostLeftCountdown}
          </Text>
          <Text className="font-sans text-sm text-mutedForeground">Redirecting to lobby...</Text>
        </View>
      </Shell>
    );
  }

  if (!ready || isLoading) {
    return (
      <Shell>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-foreground animate-pulse">Loading your game</Text>
        </View>
      </Shell>
    );
  }

  if (!game) {
    return (
      <Shell>
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-center text-lg font-bold text-foreground">
            No game with code {roomCode}
          </Text>
          <Button variant="surface" onPress={() => router.push("/")}>
            Back to lobby
          </Button>
        </View>
      </Shell>
    );
  }

  if (game.status === "waiting") {
    return (
      <WaitingLobby
        roomCode={roomCode}
        game={game as WaitingGame}
        isSpectator={isSpectator}
        joinError={joinMutation.isError ? (joinMutation.error as Error).message : null}
        shareUrl={joinUrl(siteUrl(), roomCode)}
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

  return (
    <ActiveBoard
      game={game}
      roomCode={roomCode}
      sessionId={sessionId}
      queryKey={queryKey}
      activeReaction={activeReaction}
      onSendReaction={showReaction}
    />
  );
}

function ActiveBoard({
  game,
  roomCode,
  sessionId,
  queryKey,
  activeReaction,
  onSendReaction,
}: {
  game: any;
  roomCode: string;
  sessionId: string | null;
  queryKey: unknown[];
  activeReaction: { key: number; emoji: string; slot: 1 | 2 } | null;
  onSendReaction: (emoji: string, senderSlot: 1 | 2) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<number[]>([]);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [hideGameOver, setHideGameOver] = useState(false);

  const historyMoves = useMemo<HistoryMove[]>(() => game.history ?? [], [game.history]);
  const gridLetters = useMemo<string[]>(() => game.grid ?? [], [game.grid]);
  const review = useMoveReview({
    grid: gridLetters,
    moves: historyMoves,
    playerOneId: game?.players.one?.id ?? null,
  });

  const isCompleted = game.status === "completed";
  useInvalidateOnGameComplete(isCompleted, queryClient);

  useSweepTimer({
    status: game.status,
    turnDeadline: game.turnDeadline,
    sessionId,
    roomCode,
    queryClient,
    queryKey,
  });

  const moveMutation = useMutation({
    mutationFn: () =>
      submitMoveFn({
        sessionId: sessionId!,
        roomCode,
        word: selection.map((i) => game.grid[i]).join(""),
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
      queryClient.invalidateQueries({ queryKey });
    },
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
    onSuccess: ({ roomCode: next }: { roomCode: string }) => {
      setHideGameOver(true);
      router.push(`/game/${next}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sendReaction = (emoji: ReactionEmoji) => {
    setShowReactions(false);
    const slot = game.viewerSlot;
    if (slot !== 1 && slot !== 2) return;
    onSendReaction(emoji, slot);
    sendReactionFn({ sessionId: sessionId!, roomCode, emoji }).catch((error: Error) =>
      toast.error(error.message),
    );
  };

  const isSpectator = game.viewerSlot === null;
  const viewerId =
    game.viewerSlot === 1
      ? game.players.one?.id
      : game.viewerSlot === 2
        ? game.players.two?.id
        : null;
  const yourTurn = !!viewerId && viewerId === game.currentTurnPlayerId && game.status === "active";
  const canPlay = yourTurn && !review.isReviewing;

  const toggleTile = (index: number) => {
    if (!canPlay) return;
    setSelection((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const p1IsActive = game.currentTurnPlayerId === game.players.one?.id;
  const p2IsActive = game.currentTurnPlayerId === game.players.two?.id;

  const owners = (review.frame?.state.owners ?? game.owners) as TileOwner[];
  const locked = review.frame?.state.locked ?? game.locked;

  return (
    <Shell>
      <View className="min-h-0 flex-1 justify-around gap-5">
        <View className="h-10 -mx-3 justify-center flex">
          <PlayedWords game={game} />
        </View>
        <ScoreBar
          game={game}
          p1Active={p1IsActive && game.status === "active"}
          p2Active={p2IsActive && game.status === "active"}
          reaction={activeReaction}
          scores={review.frame?.state.scores}
        />

        <BoardGrid
          grid={game.grid}
          owners={owners}
          locked={locked}
          selection={review.frame ? review.frame.claimed : selection}
          disabled={!canPlay}
          onToggleTile={toggleTile}
        />

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

        <ConfirmDialog
          open={showPassConfirm}
          title="Skip your turn?"
          description="Your turn will be passed to your opponent."
          confirmLabel="Skip"
          pendingLabel="Skipping…"
          isPending={passMutation.isPending}
          onConfirm={() => passMutation.mutate()}
          onCancel={() => setShowPassConfirm(false)}
        />

        <ConfirmDialog
          open={showForfeitConfirm}
          title="Leave the game?"
          description="Your opponent will win if you leave now."
          confirmLabel="Leave"
          cancelLabel="Stay"
          pendingLabel="Leaving…"
          isPending={forfeitMutation.isPending}
          onConfirm={() => forfeitMutation.mutate()}
          onCancel={() => setShowForfeitConfirm(false)}
        />

        {game.status === "completed" && !hideGameOver && (
          <GameOver
            game={game}
            onExit={() => {
              setHideGameOver(true);
              router.push("/");
            }}
            onRematch={() => rematchMutation.mutate()}
            rematchPending={rematchMutation.isPending}
          />
        )}
      </View>
    </Shell>
  );
}
