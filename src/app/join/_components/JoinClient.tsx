"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";

import { useSession } from "@/hooks/use-session";
import { joinGameFn } from "@/lib/game/api.client";
import { RoomCodeKeyboard } from "@/components/ui/room-code-keyboard";

const CODE_LENGTH = 5;

export function JoinClient() {
  const { sessionId, displayName, ready } = useSession();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const joinMutation = useMutation({
    mutationFn: () =>
      joinGameFn({ sessionId: sessionId!, displayName, roomCode: joinCode.trim().toUpperCase() }),
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
    <main className="dot-paper mx-auto h-[100dvh] overflow-hidden max-w-2xl px-5 py-6 flex flex-col relative">
      <Header />

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="flex-1 flex flex-col pt-4">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 text-center">
            Room code
          </p>

          <div className="flex gap-2 w-full max-w-[280px] mx-auto mb-8">
            {Array.from({ length: 5 }, (_, i) => {
              const char = joinCode[i];
              const isCursor = i === joinCode.length;
              return (
                <div
                  key={i}
                  className={`
                    flex-1 h-14 flex items-center justify-center
                    text-2xl font-display font-bold border-2 transition-colors rounded-lg
                    ${char ? "border-ink text-foreground" : ""}
                    ${!char && isCursor ? "border-ink" : ""}
                    ${!char && !isCursor ? "border-ink/20" : ""}
                  `}
                >
                  {char ??
                    (isCursor ? (
                      <span className="w-[2px] h-6 bg-foreground animate-pulse" />
                    ) : null)}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!ready || joinMutation.isPending || joinCode.length < 5}
            className="chunky-btn w-full bg-primary py-4 text-lg text-primary-foreground"
          >
            {joinMutation.isPending ? "Joining…" : "Let's go!"}
          </button>

          {joinMutation.error && (
            <p className="text-center text-sm font-semibold text-destructive mt-4">
              {joinMutation.error.message}
            </p>
          )}
        </div>

        <div className="-mx-3 mt-auto">
          <RoomCodeKeyboard
            onKey={handleKey}
            onBackspace={handleBackspace}
            onEnter={handleSubmit}
            showNumbers={true}
          />
        </div>
      </div>
    </main>
  );
}
