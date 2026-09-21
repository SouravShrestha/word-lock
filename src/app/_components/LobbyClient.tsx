"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

import { HowToPlay } from "@/components/HowToPlay";
import { HomeBackdrop } from "@/components/HomeBackdrop";
import { Wordmark } from "@/components/Wordmark";
import { SectionLabel } from "@/components/SectionLabel";
import { PlayIcon } from "@/components/icons/PlayIcon";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { BottomNav, NAV_SHELL, NAV_CONTENT_INSET } from "@/components/BottomNav";
import { StreakPill, StarsPill } from "@/components/StatPills";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { fetchLobby, createGameFn, timeoutGameFn } from "@/lib/game/api.client";
import { timeLeftLabel } from "@/lib/game/format";

export function LobbyClient() {
  const { sessionId, ready } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["lobby", sessionId],
    enabled: ready,
    queryFn: () => fetchLobby({ sessionId: sessionId! }),
  });

  const createMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId: sessionId! }),
    onSuccess: ({ roomCode }) => router.push(`/game/${roomCode}`),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (ready) queryClient.invalidateQueries({ queryKey: ["lobby"] });
  }, [ready, queryClient]);

  useEffect(() => {
    if (!ready) return;

    const channel = supabase
      .channel("lobby-games")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wl_games",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["lobby", sessionId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, queryClient, sessionId]);

  const games = useMemo(() => data?.games ?? [], [data?.games]);
  const activeGames = useMemo(() => games.filter((g: any) => g.status === "active"), [games]);

  const hasGames = activeGames.length > 0;

  return (
    <main className={NAV_SHELL}>
      <HomeBackdrop />

      <div className="flex items-center justify-between px-6 pt-5">
        <StreakPill />
        <StarsPill />
      </div>

      {/* Padding clears both the pinned footer row and the nav below it. */}
      <div
        className={`flex flex-1 flex-col overflow-y-hidden pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-24 ${hasGames ? "mt-10" : ""}`}
      >
        {/*
          With nothing to continue, the wordmark + play buttons are the whole
          screen, so they centre in the free space instead of hugging the top.
        */}
        <section
          className={`flex flex-col items-center ${hasGames ? "pb-8 pt-4" : "flex-1 justify-center pb-8"}`}
        >
          <Wordmark />

          <div className="mt-16 flex w-full max-w-sm flex-row gap-4 px-5">
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!ready || createMutation.isPending}
              className="soft-btn btn-sky flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-base"
            >
              <PlayIcon className="h-3 w-3" />
              {createMutation.isPending ? "Creating" : "New Game"}
            </button>
            <Link
              href="/join"
              className="soft-btn btn-blush flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-base"
            >
              <HeartIcon className="h-3 w-3" />
              Join
            </Link>
          </div>
        </section>

        {hasGames && <GameList title="Continue your games" games={activeGames} />}
      </div>

      {/*
        Pinned above the nav instead of living in the scroll flow, where
        `mt-auto` stopped working as soon as the content overflowed.
        `pointer-events-none` lets scroll gestures pass through the band; the
        button itself opts back in.
      */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-end px-6 pb-3.5 pt-2 lg:bottom-0 ${NAV_CONTENT_INSET}`}
      >
        <HowToPlay className="pointer-events-auto" />
      </div>

      <BottomNav />
    </main>
  );
}

function GameList({ title, games }: { title: string; games: any[] }) {
  if (games.length === 0) return null;

  return (
    <section className="py-2">
      <SectionLabel className="px-5">{title}</SectionLabel>
      <ul className="no-scrollbar flex snap-x snap-mandatory overflow-x-scroll py-4 mt-2">
        {games.map((game, idx) => (
          <GameCard key={game.id} game={game} idx={idx} totalGames={games.length} />
        ))}
      </ul>
    </section>
  );
}

function GameCard({ game, idx, totalGames }: { game: any; idx: number; totalGames: number }) {
  const [, setTick] = useState(0);

  const { sessionId } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (game.status !== "active" || !game.turnDeadline) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [game.status, game.turnDeadline]);

  useEffect(() => {
    if (game.status !== "active" || !game.turnDeadline) return;

    const msLeft = new Date(game.turnDeadline).getTime() - Date.now();

    const triggerSweep = () => {
      if (!sessionId) return;
      timeoutGameFn({ sessionId, roomCode: game.roomCode })
        .then(() => queryClient.invalidateQueries({ queryKey: ["lobby"] }))
        .catch(console.error);
    };

    if (msLeft <= 0) {
      triggerSweep();
      return;
    }

    const timer = setTimeout(triggerSweep, msLeft);
    return () => clearTimeout(timer);
  }, [game.turnDeadline, game.status, queryClient, sessionId, game.roomCode]);

  const yours = game.viewerSlot;
  const yourTurn =
    game.currentTurnPlayerId && yours !== null
      ? (yours === 1 ? game.players.one?.id : game.players.two?.id) === game.currentTurnPlayerId
      : false;
  const opponent = yours === 1 ? game.players.two : game.players.one;

  return (
    <li
      className={`w-60 shrink-0 snap-start ${idx === 0 ? "pl-5" : "pl-2.5"} ${idx === totalGames - 1 ? "pr-5" : "pr-2.5"}`}
    >
      <Link
        href={`/game/${game.roomCode}`}
        className="soft-btn btn-surface flex h-full flex-col items-stretch justify-start gap-2 p-3.5 text-left"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-bold leading-tight">
            <span className="mr-1 text-xs leading-tight text-muted-foreground">vs</span>
            {opponent?.name ?? "?"}
          </p>
          <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground">
            #{game.roomCode}
          </p>
        </div>

        <p className="flex items-baseline font-display text-2xl font-semibold tracking-tight">
          <span className="text-p1">{game.scores[1]}</span>
          <span className="mx-1 text-xl font-medium text-muted-foreground">:</span>
          <span className="text-p2">{game.scores[2]}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span
            className={`text-[0.65rem] font-bold tracking-wide ${yourTurn ? "text-sun" : "text-muted-foreground"}`}
          >
            {yourTurn ? "Your turn" : "Their turn"}
          </span>
          {game.status === "active" && game.turnDeadline && (
            <span className="text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
              {timeLeftLabel(game.turnDeadline)}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
