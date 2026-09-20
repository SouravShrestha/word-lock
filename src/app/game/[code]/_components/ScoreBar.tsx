import { timeLeftLabel } from "@/lib/game/format";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

/**
 * Tile counts are padded to two digits so the number never changes width.
 *
 * A score going from 9 to 10 would otherwise widen its chip and shove the
 * clock off centre mid-turn. Leading zeros are the scoreboard convention for
 * exactly this reason, and the board is at most 25 tiles so two digits is
 * always enough.
 */
function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

/**
 * One player: their face with their name under it, and the tile count beside.
 *
 * Two lines, not three — the grid below is capped by whatever is left of the
 * viewport, so every row saved here is a bigger board. The score keeps the
 * avatar's line because those are the two things read at a glance mid-turn; the
 * name is the slow-changing label and sits under the face it belongs to.
 *
 * The chip on the right is mirrored, avatar on the outside, so the two faces sit
 * at the screen's edges and both scores read inward toward the clock. Same
 * reason a scoreboard puts the teams on opposite sides: the symmetry is what
 * says these are two halves of one thing.
 *
 * `slot` and `mirrored` are separate on purpose. Colour belongs to the seat —
 * player one is always `p1` on both screens, so a tile's colour on the grid and
 * a player's ring here can never disagree — while the side is the viewer's own
 * point of view, and the viewer is always on the left.
 *
 * The avatar carries a ring in the player's own colour so the two sides are
 * told apart by more than position, and the whole chip dims when it is not that
 * player's turn — the turn indicator and the identity are the same object, which
 * is why there is no separate "your turn" banner on this screen.
 */
function PlayerChip({
  player,
  score,
  active,
  slot,
  mirrored,
  reaction,
}: {
  player: { name: string; avatar: string } | null;
  score: number;
  active: boolean;
  slot: 1 | 2;
  /** Lay the chip out right-to-left, so its avatar sits on the screen's edge. */
  mirrored: boolean;
  /** A reaction sent by this player, or null when none is showing. */
  reaction?: { key: number; emoji: string } | null;
}) {
  const ring = slot === 1 ? "ring-p1" : "ring-p2";
  const scoreColor = slot === 1 ? "text-p1" : "text-p2";

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", mirrored && "flex-row-reverse")}>
      {/*
        Avatar and name are one column so the name centres on the face rather
        than on the chip: the face is what the eye lands on, and a label drifting
        away from it starts to read as belonging to the clock. min-w-0 lets the
        name truncate instead of pushing the clock off centre — usernames run up
        to MAX_USERNAME_LENGTH, far wider than the third of a phone this chip
        gets, so it is clipped and the full value kept in `title`.
      */}
      <div className="relative flex min-w-0 flex-col items-center gap-1.5">
        {reaction && (
          <span
            key={reaction.key}
            aria-hidden
            className="animate-in fade-in slide-in-from-bottom-2 zoom-in-50 absolute top-0 z-10 text-2xl duration-200"
          >
            {reaction.emoji}
          </span>
        )}
        <Avatar
          avatar={player?.avatar}
          className={cn(
            "h-8 w-8 shrink-0 ring-offset-card transition-opacity duration-200",
            ring,
            active ? "ring-[3px] ring-offset-2" : "ring-2 ring-offset-2 opacity-60",
          )}
        />
        <p
          title={player?.name ?? undefined}
          className={cn(
            "mt-1.5 max-w-full truncate text-center text-xs leading-none",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {player?.name ?? "-"}
        </p>
      </div>
      <p
        className={cn(
          "font-display text-3xl font-bold leading-none tabular-nums mx-4",
          active ? scoreColor : "text-muted-foreground",
        )}
      >
        {formatScore(score)}
      </p>
    </div>
  );
}

/**
 * The board's top panel: both players and how long the current turn has left.
 *
 * The viewer is always the left chip and their opponent always the right one, so
 * "my score" is the same glance on both screens. Only the order is relative —
 * the seat colours stay fixed, so the left chip is `p1` for one player and `p2`
 * for the other, matching the tiles each of them owns on the grid below. A
 * spectator gets the seat order, player one first.
 *
 * Nothing actionable lives here. Leaving, the menu and quitting for real are
 * all in the bottom bar, so the panel next to the scores cannot be mistaken for
 * a place to tap.
 */
export function ScoreBar({
  game,
  p1Active,
  p2Active,
  reaction,
  scores,
}: {
  game: any;
  p1Active: boolean;
  p2Active: boolean;
  /** The most recent reaction, with the slot that sent it, or null. */
  reaction?: { key: number; emoji: string; slot: 1 | 2 } | null;
  /**
   * Tile counts to show instead of the live ones, used while a past turn is
   * being reviewed. The scores have to come from the same board the grid is
   * drawing or the panel would be counting tiles that are not on screen.
   */
  scores?: { 1: number; 2: number };
}) {
  const timerLabel = game.status === "active" ? timeLeftLabel(game.turnDeadline) : null;

  const nearSlot: 1 | 2 = game.viewerSlot === 2 ? 2 : 1;
  const farSlot: 1 | 2 = nearSlot === 1 ? 2 : 1;

  const chipFor = (slot: 1 | 2) => ({
    slot,
    player: slot === 1 ? game.players.one : game.players.two,
    score: (scores ?? game.scores)[slot],
    active: slot === 1 ? p1Active : p2Active,
    reaction: reaction?.slot === slot ? reaction : null,
  });

  return (
    <div className="neo px-2 pt-2 pb-2 bg-transparent">
      <div className="flex items-center gap-2">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />

        {/*
          Centre: the turn clock. shrink-0 because "Game over" is the widest
          thing it ever says and wrapping it would make the panel taller than
          the two chips beside it.
        */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <ClockIcon className="h-4 w-4 text-foreground" />
          <p className="font-display text-xs font-medium tabular-nums tracking-wide leading-none">
            {timerLabel ?? (game.status === "completed" ? "Game over" : "-")}
          </p>
        </div>

        <PlayerChip {...chipFor(farSlot)} mirrored />
      </div>
    </div>
  );
}
