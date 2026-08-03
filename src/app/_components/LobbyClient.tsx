"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlayIcon } from "@/components/icons/PlayIcon";
import { HashIcon } from "@/components/icons/HashIcon";
import Link from "next/link";

import { HowToPlay } from "@/components/HowToPlay";
import { Wordmark } from "@/components/Wordmark";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { fetchLobby, createGameFn, timeoutGameFn } from "@/lib/game/api.client";
import { timeLeftLabel } from "@/lib/game/format";
import packageJson from "../../../package.json";

export function LobbyClient() {
  const { sessionId, displayName, setDisplayName, ready } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["lobby", sessionId],
    enabled: ready,
    queryFn: () => fetchLobby({ sessionId: sessionId!, displayName }),
  });

  const createMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId: sessionId!, displayName }),
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
  const finishedGames = useMemo(() => games.filter((g: any) => g.status === "completed"), [games]);

  return (
    <main className="dot-paper mx-auto max-w-2xl flex h-[100dvh] overflow-hidden flex-col items-center justify-center relative">
      <div className="absolute top-6 inset-x-0 w-full flex justify-center px-5">
        <div className="w-full max-w-3xl">
          <Header />
        </div>
      </div>
      <div className="w-full max-w-3xl px-5 flex flex-col items-center justify-center">
        <div className="w-full">
          <header className="flex flex-col items-center text-center">
            <Wordmark stacked />
          </header>

          <section className="mx-auto mt-12 max-w-sm">
            <div className="flex flex-row gap-3">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!ready || createMutation.isPending}
                className="neo neo-press inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-display text-base font-bold text-primary-foreground"
              >
                <PlayIcon className="h-3.5 w-3.5" fill="black" aria-hidden />
                {createMutation.isPending ? "Creating…" : "New game"}
              </button>
              <Link
                href="/join"
                className="neo neo-press inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-card px-4 py-3.5 font-display text-base font-bold text-foreground"
              >
                <HashIcon className="h-4 w-4" aria-hidden />
                Join game
              </Link>
            </div>
          </section>

          {activeGames.length > 0 && <GameList title="Your games" games={activeGames} />}
        </div>
      </div>

      <HowToPlay />

      <p className="absolute bottom-4 left-4 text-[0.65rem] font-mono text-muted-foreground/50 select-none">
        v{packageJson.version}
      </p>
    </main>
  );
}

function GameList({ title, games }: { title: string; games: any[] }) {
  if (games.length === 0) return null;

  return (
    <section className="mt-16 py-2 -mx-5 flex-1">
      <h2 className="text-xl mx-5">
        <span className="marker">{title}</span>
      </h2>
      <ul className="no-scrollbar flex snap-x snap-mandatory overflow-x-scroll py-5">
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
  const live = yourTurn && game.status !== "completed";

  return (
    <li
      className={`w-48 shrink-0 snap-start ${idx === 0 ? "pl-5" : "pl-2.5"} ${idx === totalGames - 1 ? "pr-5" : "pr-2.5"}`}
    >
      <a href={`/game/${game.roomCode}`} className="neo neo-press flex h-full flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="truncate text-sm font-bold leading-tight">
            <span className="text-xs leading-tight text-muted-foreground mr-1">vs</span>
            {game.status === "waiting" ? "Waiting for opponent…" : (opponent?.name ?? "?")}
          </p>
          <p className="text-xs text-muted-foreground font-mono font-medium tracking-wider">
            #{game.roomCode}
          </p>
        </div>

        <p className="font-display text-2xl font-semibold tracking-tight flex items-baseline">
          <span className="text-p1">{game.scores[1]}</span>
          <span className="text-muted-foreground mx-1 text-xl font-medium">:</span>
          <span className="text-p2">{game.scores[2]}</span>
        </p>

        <div className="flex flex-col gap-1.5 mt-auto -mx-3.5 -mb-2.5">
          <div className="flex items-center justify-end">
            <span
              className={`rounded-md border-0 border-foreground px-2.5 py-1 text-[0.65rem] tracking-wider ${
                live ? "bg-card text-foreground" : "bg-card text-foreground"
              }`}
            >
              {game.status === "completed"
                ? "Done"
                : game.status === "waiting"
                  ? "Waiting"
                  : yourTurn
                    ? "Your turn"
                    : "Their turn"}
            </span>
          </div>
          {game.status === "active" && game.turnDeadline && (
            <div className="flex items-center justify-end">
              <span className="text-[0.65rem] text-muted-foreground font-mono tabular-nums mx-2.5 -mt-1.5 mb-0.5">
                {timeLeftLabel(game.turnDeadline)}
              </span>
            </div>
          )}
        </div>
      </a>
    </li>
  );
}
