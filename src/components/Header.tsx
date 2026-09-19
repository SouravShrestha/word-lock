"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * In-game header: a back button that asks for confirmation before leaving,
 * plus the theme toggle.
 */
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
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExit = () => {
    setShowConfirm(false);
    if (onExit) onExit();
    else router.push("/");
  };

  return (
    <header className={`flex w-full items-center justify-between ${compact ? "mb-1" : "mb-4"}`}>
      <BackButton onClick={() => setShowConfirm(true)} label="Leave game" />
      <ThemeToggle />

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="surface flex w-full max-w-xs flex-col gap-4 p-6">
            <div className="text-center">
              <h2 className="text-lg font-bold">{alertTitle}</h2>
              <div className="mt-1 text-sm text-muted-foreground">{alertDescription}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="soft-btn btn-surface-2 flex-1 py-3"
              >
                Cancel
              </button>
              <button onClick={handleExit} className="soft-btn btn-danger flex-1 py-3">
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
