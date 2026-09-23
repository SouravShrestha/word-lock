export interface Rule {
  title: string;
  body: string;
}

export const RULES: readonly Rule[] = [
  {
    title: "Take turns",
    body: "Two players share one 5×5 letter grid. On your turn, tap letters to spell a word of 3 letters or more.",
  },
  {
    title: "Claim tiles",
    body: "Every tile you use in a valid word becomes yours. Tiles your opponent owned flip to your colour.",
  },
  {
    title: "Lock tiles",
    body: "A tile of yours surrounded on all sides (non-diagonal) by your own tiles is locked - your opponent can no longer steal it.",
  },
  {
    title: "Win the board",
    body: "The game ends when every tile is claimed. Whoever owns the most tiles wins. Turns expire after 24 hours.",
  },
] as const;

export const MIN_WORD_LENGTH = 3;
export const TURN_LIMIT_HOURS = 24;
