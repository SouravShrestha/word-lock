"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { SmileyFaceIcon } from "@/components/icons/SmileyFaceIcon";
import { LeftArrowIcon } from "@/components/icons/LeftArrowIcon";
import { PrevIcon } from "@/components/icons/PrevIcon";
import { NextIcon } from "@/components/icons/NextIcon";
import { cn } from "@/lib/utils";

function BarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "press grid h-10 flex-1 place-items-center text-muted-foreground",
        "disabled:pointer-events-none disabled:opacity-35",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The strip along the bottom edge of the board.
 *
 * The way out lives here rather than above the scoreboard: every control the
 * player reaches for during a game is in this one strip, and the board gets the
 * full width of the screen back.
 *
 * Leaving is not forfeiting — the game continues and the player can rejoin, so
 * this is a plain exit behind a confirmation. Giving up for real is still
 * behind the menu.
 *
 * The two steppers are drawn because the bar reads as a bar with these seats,
 * but they have no behaviour agreed yet and are shipped disabled rather than
 * guessing at one — a control that does something unexpected is worse than one
 * that is visibly not ready. Reactions are the one seat that does have a job:
 * it opens the emoji picker.
 */
export function GameBottomBar({
  onOpenMenu,
  onOpenReactions,
  canReact,
}: {
  onOpenMenu: () => void;
  onOpenReactions: () => void;
  /** False for a spectator, who has no seat to react from. */
  canReact: boolean;
}) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  return (
    <div className="flex items-center justify-around gap-2 border-t border-hairline pt-2">
      <BarButton label="Leave game" onClick={() => setShowLeaveConfirm(true)}>
        <LeftArrowIcon className="h-4 w-4" />
      </BarButton>

      <BarButton label="Game menu" onClick={onOpenMenu}>
        <MenuIcon className="h-4 w-4" />
      </BarButton>

      <BarButton label="Send a reaction" onClick={onOpenReactions} disabled={!canReact}>
        <SmileyFaceIcon className="h-6 w-6" />
      </BarButton>

      {/* TODO: step through the move history — no behaviour defined yet. */}
      <BarButton label="Previous move" disabled>
        <PrevIcon className="h-4 w-4" />
      </BarButton>

      <BarButton label="Next move" disabled>
        <NextIcon className="h-4 w-4" />
      </BarButton>

      <ConfirmDialog
        open={showLeaveConfirm}
        title="Leave the game?"
        description={
          <>
            The game will continue without you.
            <br />
            You can rejoin anytime.
          </>
        }
        confirmLabel="Exit"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          router.push("/");
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
