import { useState } from "react";
import { Check, Copy } from "@/components/icons";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";
import { AvatarMonkeyIcon } from "@/components/icons/AvatarMonkeyIcon";
import { InviteIcon } from "@/components/icons/InviteIcon";
import { BackButton } from "@/components/BackButton";
import { SectionLabel } from "@/components/SectionLabel";
import { InviteFriends } from "./InviteFriends";

export function WaitingLobby({
  roomCode,
  game,
  isSpectator,
  joinError,
  onDestroy,
  onStart,
  shareUrl,
  onLeave,
}: {
  roomCode: string;
  game: any;
  isSpectator: boolean;
  joinPending?: boolean;
  joinError: string | null;
  onDestroy: () => void;
  onStart: () => Promise<any>;
  shareUrl: string;
  sessionId?: string | null;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const opponentJoined = !!game.players.two;
  const isHost = game.viewerSlot === 1;

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Join my Word-lock game!", url: shareUrl }).catch(console.error);
    } else {
      navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <main className="relative mx-auto flex h-[100dvh] max-w-2xl flex-col overflow-hidden">
      <div className="px-5 pt-5">
        <BackButton onClick={() => setShowConfirm(true)} label="Exit lobby" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col items-center gap-10 px-5 py-10">
          {/* Room code */}
          {isHost ? (
            <button
              onClick={handleCopy}
              aria-label="Copy room code"
              className="soft-btn btn-surface select-none py-3 pl-7 pr-5"
            >
              <span className="font-display text-xl font-bold tracking-[0.3em]">{roomCode}</span>
              <span className="flex items-center justify-center text-muted-foreground">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </span>
            </button>
          ) : (
            <div className="select-none py-3">
              <span className="font-display text-xl font-bold tracking-[0.3em]">#{roomCode}</span>
            </div>
          )}

          {/* Players */}
          <div className="flex w-full max-w-xs items-start justify-between px-4">
            <PlayerSlot name={game.players.one?.name ?? "You"}>
              <AvatarPandaIcon className="h-9 w-9" />
            </PlayerSlot>

            <span className="pt-7 text-sm font-bold text-muted-foreground">vs</span>

            {opponentJoined ? (
              <PlayerSlot name={game.players.two.name}>
                <AvatarMonkeyIcon className="h-9 w-9" />
              </PlayerSlot>
            ) : isHost ? (
              <button onClick={handleShare} className="flex flex-col items-center gap-2.5">
                <span className="surface press grid h-16 w-16 place-items-center">
                  <InviteIcon className="h-5 w-5" />
                </span>
                <span className="max-w-20 truncate text-center text-xs font-bold">Share link</span>
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <span className="grid h-16 w-16 place-items-center rounded-[0.9rem] bg-surface/40">
                  <AvatarMonkeyIcon className="h-9 w-9 opacity-20" />
                </span>
                <span className="invisible text-xs">·</span>
              </div>
            )}
          </div>

          {/* Primary action */}
          <div className="flex w-full max-w-xs flex-col items-center gap-2">
            {isSpectator ? (
              <p className="py-4 text-sm font-semibold text-muted-foreground">
                {joinError ? (
                  <span className="text-destructive">{joinError}</span>
                ) : (
                  <span className="animate-pulse">Joining game…</span>
                )}
              </p>
            ) : isHost ? (
              <>
                <button
                  onClick={handleStart}
                  disabled={!opponentJoined || starting}
                  className="soft-btn btn-blush w-[65%] py-3.5 text-base"
                >
                  {starting ? "Starting…" : "Start Game"}
                </button>
                {!opponentJoined && (
                  <p className="animate-pulse text-xs font-bold text-muted-foreground">
                    Waiting for opponent
                  </p>
                )}
                {startError && <p className="text-xs text-destructive">{startError}</p>}
              </>
            ) : (
              <p className="animate-pulse py-4 text-sm font-semibold text-muted-foreground">
                {opponentJoined ? "Waiting for host to start" : "Waiting for opponent"}
              </p>
            )}
          </div>
        </div>

        {isHost && !opponentJoined && (
          <section className="pb-6 pt-2">
            <SectionLabel className="pl-5">Invite friends</SectionLabel>
            <InviteFriends shareUrl={shareUrl} roomCode={roomCode} />
          </section>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="surface flex w-full max-w-xs flex-col gap-4 p-6">
            <div className="text-center">
              <h2 className="text-lg font-bold">Exit lobby?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isHost ? "The lobby will be disbanded." : "You'll leave the game lobby."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="soft-btn btn-surface-2 flex-1 py-3"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  (isHost ? onDestroy : onLeave)();
                }}
                className="soft-btn btn-danger flex-1 py-3"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PlayerSlot({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="surface grid h-16 w-16 place-items-center">{children}</span>
      <span title={name} className="max-w-20 truncate text-center text-xs font-bold">
        {name}
      </span>
    </div>
  );
}
