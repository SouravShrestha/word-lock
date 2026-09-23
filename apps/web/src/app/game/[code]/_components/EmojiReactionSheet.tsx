"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { REACTION_EMOJIS, type ReactionEmoji } from "@word-lock/core/game";

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
