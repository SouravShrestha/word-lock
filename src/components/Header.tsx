"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LeftArrowIcon } from "@/components/icons/LeftArrowIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NameBadge } from "@/components/NameBadge";
import { useSession } from "@/hooks/use-session";

export function Header({
  alertTitle = "Leave the game?",
  alertDescription = (
    <>
      The game will continue without you.
      <br />
      You can rejoin anytime.
    </>
  ),
  onExit,
  compact = false,
}: {
  alertTitle?: string;
  alertDescription?: React.ReactNode;
  onExit?: () => void;
  compact?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { displayName } = useSession();

  const isHome = pathname === "/";
  const needsConfirm = !isHome && !pathname.startsWith("/join") && !pathname.startsWith("/profile");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExit = () => {
    setShowConfirm(false);
    if (onExit) {
      onExit();
    } else {
      router.push("/");
    }
  };

  return (
    <header className={`flex justify-between items-center w-full ${compact ? "mb-1" : "mb-4"}`}>
      {isHome ? (
        <NameBadge value={displayName} />
      ) : needsConfirm ? (
        <>
          <button
            onClick={() => setShowConfirm(true)}
            className="chunky-btn grid h-10 w-10 place-items-center bg-sun hover:bg-sun transition-colors"
            aria-label="Back"
          >
            <LeftArrowIcon className="w-5 h-5" />
          </button>

          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm px-6">
              <div className="neo bg-card w-full max-w-xs p-6 flex flex-col gap-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold">{alertTitle}</h2>
                  <div className="mt-1 text-sm text-muted-foreground">{alertDescription}</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="chunky-btn flex-1 bg-card py-3 text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExit}
                    className="chunky-btn flex-1 bg-destructive py-3 text-destructive-foreground"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => router.push("/")}
          className="chunky-btn grid h-10 w-10 place-items-center bg-[var(--sun)] hover:bg-[var(--sun)] transition-colors"
          aria-label="Back"
        >
          <LeftArrowIcon className="w-5 h-5" />
        </button>
      )}
      <ThemeToggle />
    </header>
  );
}
