/**
 * The fixed set of reactions players can send mid-game.
 *
 * Deliberately closed rather than freeform: the picker offers exactly these,
 * and the server only accepts one of these, so there is no path for arbitrary
 * text (or someone else's emoji spam) to render on another player's screen.
 */
export const REACTION_EMOJIS = [
  "😀",
  "❤️",
  "😂",
  "😭",
  "😮",
  "😢",
  "🥹",
  "😡",
  "🥲",
  "😎",
  "🤔",
  "👏",
  "👍",
  "🔥",
  "🎉",
  "💀",
  "🫠",
] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value);
}
