import { timeLeftLabel } from "@/lib/game/format";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

/**
 * One player: their face with their name under it, and the tile count beside.
 *
 * Two lines, not three — the grid below is capped by whatever is left of the
 * viewport, so every row saved here is a bigger board. The score keeps the
 * avatar's line because those are the two things read at a glance mid-turn; the
 * name is the slow-changing label and sits under the face it belongs to.
 *
 * Player two is mirrored, avatar on the outside, so the two faces sit at the
 * screen's edges and both scores read inward toward the clock. Same reason a
 * scoreboard puts the teams on opposite sides: the symmetry is what says these
 * are two halves of one thing.
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
  reaction,
}: {
  player: { name: string; avatar: string } | null;
  score: number;
  active: boolean;
  slot: 1 | 2;
  /** A reaction just sent by this player, or null when none is showing. */
  reaction?: { key: number; emoji: string } | null;
}) {
  const ring = slot === 1 ? "ring-p1" : "ring-p2";
  const scoreColor = slot === 1 ? "text-p1" : "text-p2";

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", slot === 2 && "flex-row-reverse")}>
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
        {score}
      </p>
    </div>
  );
}

/**
 * The board's top panel: both players and how long the current turn has left.
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
}: {
  game: any;
  p1Active: boolean;
  p2Active: boolean;
  /** The most recent reaction broadcast, or null when none is showing. */
  reaction?: { key: number; emoji: string; slot: 1 | 2 } | null;
}) {
  const timerLabel = game.status === "active" ? timeLeftLabel(game.turnDeadline) : null;

  return (
    <div className="neo px-3 pt-2 pb-2 bg-transparent">
      <div className="flex items-center gap-2">
        <PlayerChip
          player={game.players.one}
          score={game.scores[1]}
          active={p1Active}
          slot={1}
          reaction={reaction?.slot === 1 ? reaction : null}
        />

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

        <PlayerChip
          player={game.players.two}
          score={game.scores[2]}
          active={p2Active}
          slot={2}
          reaction={reaction?.slot === 2 ? reaction : null}
        />
      </div>
    </div>
  );
}
