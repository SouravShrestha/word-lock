"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { REACTION_EMOJIS, type ReactionEmoji } from "@/lib/game/reactions";

/**
 * The reaction picker, opened from the bottom bar's smiley button.
 *
 * A closed set of twelve rather than a full emoji keyboard: the point is a
 * quick, low-friction nudge at an opponent mid-game, not a chat feature. A
 * fixed grid also means the sheet closes itself the instant one is tapped —
 * there is nothing else to do in here.
 *
 * No pending or disabled state: the caller draws the emoji and closes this
 * sheet on the tap itself, without waiting on the network, so there is never a
 * moment where a button here is waiting on something.
 */
export function EmojiReactionSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: ReactionEmoji) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Send a reaction">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">Send a reaction</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-6 gap-3">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            aria-label={`React with ${emoji}`}
            className="press grid aspect-square place-items-center text-3xl"
          >
            {emoji}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
