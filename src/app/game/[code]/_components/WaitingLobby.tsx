import { useState } from "react";
import { Header } from "@/components/Header";
import { Check, Copy } from "@/components/icons";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";
import { AvatarMonkeyIcon } from "@/components/icons/AvatarMonkeyIcon";
import { InviteIcon } from "@/components/icons/InviteIcon";

export function WaitingLobby({
  roomCode,
  game,
  isSpectator,
  joinPending,
  joinError,
  onDestroy,
  onStart,
  shareUrl,
  sessionId,
  onLeave,
}: {
  roomCode: string;
  game: any;
  isSpectator: boolean;
  joinPending: boolean;
  joinError: string | null;
  onDestroy: () => void;
  onStart: () => Promise<any>;
  shareUrl: string;
  sessionId: string | null;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const opponentJoined = !!game.players.two;
  const isHost = game.viewerSlot === 1;

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (navigator.share) {
      navigator.share({ title: "Join my Word-lock game!", url: shareUrl }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      await onStart();
    } catch (e: any) {
      setStartError(e?.message ?? "Failed to start. Try again.");
      setStarting(false);
    }
  };

  return (
    <main className="dot-paper mx-auto h-[100dvh] overflow-hidden max-w-2xl px-5 py-6 flex flex-col relative">
      <Header
        alertTitle="Exit lobby?"
        alertDescription={isHost ? "The lobby will be disbanded." : "You'll leave the game lobby."}
        onExit={isHost ? onDestroy : onLeave}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-14 pb-10">
        {/* Room code badge */}
        {isHost ? (
          <button
            onClick={handleCopy}
            aria-label="Copy room code"
            className="flex items-center gap-3 pl-7 pr-5 py-3 bg-card border-2 border-ink chunky-btn select-none"
          >
            <span className="text-2xl font-display font-bold tracking-[0.2em]">{roomCode}</span>
            <span className="flex items-center justify-center text-foreground">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3 pl-7 pr-7 py-3 select-none">
            <span className="text-2xl font-display font-bold tracking-[0.2em]">#{roomCode}</span>
          </div>
        )}

        {/* Players */}
        <div className="flex items-center w-full justify-between px-6 max-w-xs">
          {/* Host */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 overflow-hidden items-center justify-center flex border-2 border-ink rounded-md">
              <AvatarPandaIcon className="w-10 h-10" />
            </div>
            <span className="text-sm font-semibold truncate max-w-20 text-center">
              {game.players.one?.name ?? "You"}
            </span>
          </div>

          <span className="text-base font-semibold text-muted-foreground">vs</span>

          {/* Opponent / Invite */}
          {opponentJoined ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 overflow-hidden items-center justify-center flex border-2 border-ink rounded-md">
                <AvatarMonkeyIcon className="w-10 h-10" />
              </div>
              <span className="text-sm font-semibold truncate max-w-20 text-center">
                {game.players.two?.name}
              </span>
            </div>
          ) : isHost ? (
            <button onClick={handleInvite} className="flex flex-col items-center gap-3 group">
              <div className="w-20 h-20 border-2 border-ink chunky-btn flex items-center justify-center bg-card group-hover:bg-neutral-tile transition-colors">
                <InviteIcon className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">Invite a friend</span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 border-2 border-ink/20 rounded-md flex items-center justify-center">
                <AvatarMonkeyIcon className="w-10 h-10 opacity-20" />
              </div>
              <span className="text-sm font-semibold invisible">·</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isSpectator ? (
          <div className="w-[60%] py-4 text-center text-muted-foreground text-sm font-semibold">
            {joinError ? (
              <span className="text-destructive">{joinError}</span>
            ) : (
              <span className="animate-pulse">Joining game…</span>
            )}
          </div>
        ) : isHost ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <button
              onClick={handleStart}
              disabled={!opponentJoined || starting}
              className="chunky-btn w-[60%] bg-primary py-4 text-primary-foreground font-semibold transition-opacity disabled:opacity-80"
            >
              {starting ? "Starting game..." : "Start game"}
            </button>
            {!opponentJoined && (
              <p className="text-xs mt-1 text-muted-foreground animate-pulse">
                Waiting for opponent to join
              </p>
            )}
            {startError && <p className="text-xs text-destructive">{startError}</p>}
          </div>
        ) : (
          <div className="w-[60%] py-4 text-center text-muted-foreground text-sm font-semibold">
            {opponentJoined ? (
              <span className="animate-pulse">Waiting for host to start the game</span>
            ) : (
              <span className="animate-pulse">Waiting for opponent to join</span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
