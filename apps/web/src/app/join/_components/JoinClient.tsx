"use client";
import { useSession, joinGameFn } from "@word-lock/client";

import { roomCodeAfterPaste } from "@word-lock/core/game";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { BackButton } from "@/components/BackButton";
import { RoomCodeKeyboard } from "@/components/ui/room-code-keyboard";

const CODE_LENGTH = 5;

export function JoinClient() {
  const { sessionId, ready } = useSession();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const joinMutation = useMutation({
    mutationFn: () =>
      joinGameFn({
        sessionId: sessionId!,
        roomCode: joinCode.trim().toUpperCase(),
      }),
    onSuccess: ({ roomCode }) => router.push(`/game/${roomCode}`),
  });

  const handleKey = (char: string) => {
    if (joinCode.length < CODE_LENGTH) {
      setJoinCode((joinCode + char).toUpperCase());
      if (joinMutation.error) joinMutation.reset();
    }
  };

  const handleBackspace = () => {
    setJoinCode(joinCode.slice(0, -1));
    if (joinMutation.error) joinMutation.reset();
  };

  // Every paste lands here: Ctrl/Cmd+V anywhere, or long-press/right-click > Paste on the boxes.
  // preventDefault stops the browser inserting the text into the overlay input itself.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setJoinCode(roomCodeAfterPaste(joinCode, e.clipboardData?.getData("text") ?? ""));
      joinMutation.reset();
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const handleSubmit = () => {
    if (joinCode.length === CODE_LENGTH) {
      joinMutation.mutate();
    }
  };

  return (
    <main className="relative mx-auto flex h-[100dvh] max-w-2xl flex-col overflow-hidden">
      <div className="px-5 pt-5">
        <BackButton />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col overflow-hidden px-5">
        <div className="relative mx-auto mb-8 mt-20 flex w-full max-w-[300px] gap-2.5">
          {/* Invisible input so a long-press offers the system Paste menu. inputMode="none" keeps the
              OS keyboard away; typing still goes through RoomCodeKeyboard, so onChange is a no-op. */}
          <input
            value={joinCode}
            onChange={() => {}}
            inputMode="none"
            autoComplete="off"
            aria-label="Room code"
            className="absolute inset-0 z-10 w-full bg-transparent text-transparent caret-transparent outline-none"
          />
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const char = joinCode[i];
            const isCursor = i === joinCode.length;
            return (
              <div
                key={i}
                className={`surface flex h-12 flex-1 items-center justify-center font-display text-xl font-bold transition-shadow border-2 ${
                  isCursor ? "border-sky" : "border-border"
                }`}
              >
                {char ?? null}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!ready || joinMutation.isPending || joinCode.length < CODE_LENGTH}
          className="soft-btn btn-sky mx-auto w-full max-w-[240px] py-3.5 tv-body-base"
        >
          {joinMutation.isPending ? "Joining" : "Let's go!"}
        </button>

        {joinMutation.error && (
          <p className="mt-4 text-center tv-label text-destructive">{joinMutation.error.message}</p>
        )}

        <div className="-mx-2 mt-auto">
          <RoomCodeKeyboard
            onKey={handleKey}
            onBackspace={handleBackspace}
            onEnter={handleSubmit}
            showNumbers
          />
        </div>
      </div>
    </main>
  );
}
