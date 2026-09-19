"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { BackButton } from "@/components/BackButton";
import { SectionLabel } from "@/components/SectionLabel";
import { useSession } from "@/hooks/use-session";
import { joinGameFn } from "@/lib/game/api.client";
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
        <SectionLabel className="mt-8">Join a room</SectionLabel>

        <div className="mx-auto mb-8 mt-8 flex w-full max-w-[300px] gap-2.5">
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const char = joinCode[i];
            const isCursor = i === joinCode.length;
            return (
              <div
                key={i}
                className={`surface flex h-12 flex-1 items-center justify-center font-display text-xl font-bold transition-shadow ${
                  isCursor ? "ring-2 ring-sky" : ""
                }`}
              >
                {char ?? null}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!ready || joinMutation.isPending || joinCode.length < CODE_LENGTH}
          className="soft-btn btn-sky mx-auto w-full max-w-[240px] py-3.5 text-base"
        >
          {joinMutation.isPending ? "Joining…" : "Let's go!"}
        </button>

        {joinMutation.error && (
          <p className="mt-4 text-center text-sm font-semibold text-destructive">
            {joinMutation.error.message}
          </p>
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
