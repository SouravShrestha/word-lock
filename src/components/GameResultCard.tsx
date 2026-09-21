"use client";

import type { ReactNode } from "react";

import { Avatar } from "@/components/Avatar";
import { Tile, type TileOwner } from "@/components/Tile";
import { cn } from "@/lib/utils";

/**
 * The shape of a finished game this card needs. Structural rather than
 * `SerializedGame` so both callers can pass what they have: the live screen
 * holds an untyped realtime payload, the history sheet a typed fetch — and
 * neither should have to import a server-only module to name it.
 */
export interface ResultGame {
  grid: string[];
  owners: number[];
  locked: boolean[];
  scores: { 1: number; 2: number };
  endReason: string | null;
  winnerId: string | null;
  viewerSlot: 1 | 2 | null;
  starDeltas?: { 1: number | null; 2: number | null };
  players: {
    one: { id: string; name: string; avatar: string } | null;
    two: { id: string; name: string; avatar: string } | null;
  };
  playedWords: { word: string; playerId: string }[];
}

/**
 * How a finished game is shown, everywhere it is shown.
 *
 * The end-of-game overlay and the match-history sheet render the same object —
 * a scoreboard, the words that were played and the final board — so they are one
 * component rather than two copies that drift. Only the pair of buttons at the
 * bottom differs, which is what `action` is for.
 *
 * The layout mirrors the live board deliberately: scores on top in the seat
 * colours, the word strip under them, the grid below. A player reads the result
 * in the same places they were reading the game a second earlier, so nothing has
 * to be re-found.
 */
export function GameResultCard({
  game,
  onExit,
  exitLabel = "Exit",
  action,
  note,
}: {
  game: ResultGame;
  onExit: () => void;
  exitLabel?: string;
  /** The positive button beside Exit. Omitted when there is nothing to offer. */
  action?: { label: string; onClick: () => void; pending?: boolean } | null;
  /** A full-width line under the scoreboard, e.g. a league promotion. */
  note?: ReactNode;
}) {
  /*
   * The viewer sits on the left and their opponent on the right, as on the score
   * bar — but the colours stay bound to the seat, so a tile's owner on the grid
   * below and the player it is stacked under can never disagree. A spectator
   * gets seat order.
   */
  const nearSlot: 1 | 2 = game.viewerSlot === 2 ? 2 : 1;
  const farSlot: 1 | 2 = nearSlot === 1 ? 2 : 1;

  const playerFor = (slot: 1 | 2) => (slot === 1 ? game.players.one : game.players.two);

  return (
    <div className="neo border-border border-2 bg-card w-full max-w-sm overflow-hidden">
      {/* Scoreboard */}
      <div className="bg-board px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <PlayerColumn
            slot={nearSlot}
            player={playerFor(nearSlot)}
            score={game.scores[nearSlot]}
          />

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 pt-4 text-center">
            <p className="font-display text-lg font-bold leading-none">{verdict(game)}</p>
            <p className="text-xs leading-tight text-muted-foreground">{reasonLabel(game)}</p>
            <StarDelta game={game} />
          </div>

          <PlayerColumn slot={farSlot} player={playerFor(farSlot)} score={game.scores[farSlot]} />
        </div>

        {note && <div className="mt-3 flex justify-center">{note}</div>}
      </div>

      {/* Words played, oldest first — the game read left to right, as a record
          rather than the live strip's newest-first feed. */}
      <div className="no-scrollbar overflow-x-auto border-y border-border px-4 py-2.5">
        <ul className="flex h-4 w-max items-center gap-6">
          {game.playedWords.map((entry, i) => (
            <li
              key={i}
              className={cn(
                "shrink-0 text-sm leading-none",
                entry.playerId === game.players.one?.id ? "text-p1" : "text-p2",
              )}
            >
              {entry.word.charAt(0).toUpperCase() + entry.word.slice(1).toLowerCase()}
            </li>
          ))}
        </ul>
      </div>

      {/* Final board. Same hairline scheme as the live grid: the container draws
          the top and left edges, each tile its own right and bottom. */}
      <div className="p-3 bg-board">
        <div className="grid w-full grid-cols-5 border-t border-l border-border">
          {game.grid.map((letter, index) => (
            <Tile
              key={index}
              letter={letter}
              owner={game.owners[index] as TileOwner}
              locked={game.locked[index]}
              disabled
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-3 pb-4 bg-board">
        <button
          type="button"
          onClick={onExit}
          className="chunky-btn btn-surface flex-1 py-3 text-base"
        >
          {exitLabel}
        </button>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.pending}
            className="chunky-btn btn-sky flex-1 py-3 text-base"
          >
            {action.pending ? "Loading" : action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * One player: face, name, final tile count.
 *
 * Stacked rather than the score bar's sideways chip — there is no turn clock to
 * keep centred here and no grid underneath fighting for the pixels, so the
 * column reads top to bottom as identity then result. The score is not
 * zero-padded: nothing is going to change width now that the game is over.
 */
function PlayerColumn({
  slot,
  player,
  score,
}: {
  slot: 1 | 2;
  player: { name: string; avatar: string } | null;
  score: number;
}) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-2">
      <Avatar
        avatar={player?.avatar}
        className={cn(
          "h-14 w-14 ring-[3px] ring-offset-2 ring-offset-board",
          slot === 1 ? "ring-p1" : "ring-p2",
        )}
      />
      <p title={player?.name ?? undefined} className="max-w-full truncate text-xs leading-none">
        {player?.name ?? "-"}
      </p>
      <p
        className={cn(
          "font-display text-2xl font-bold leading-none tabular-nums",
          slot === 1 ? "text-p1" : "text-p2",
        )}
      >
        {score}
      </p>
    </div>
  );
}

/**
 * The result in the viewer's own terms.
 *
 * "You Win" rather than "iamcbs wins" because the player already knows which
 * side they are; a spectator, who does not, gets the name instead.
 */
function verdict(game: ResultGame) {
  const winnerSlot =
    game.winnerId === game.players.one?.id ? 1 : game.winnerId === game.players.two?.id ? 2 : null;

  if (winnerSlot === null) return "Draw";

  if (game.viewerSlot === null) {
    const winner = winnerSlot === 1 ? game.players.one : game.players.two;
    return `${winner?.name ?? "Player"} wins`;
  }

  return game.viewerSlot === winnerSlot ? "You Win" : "You Lose";
}

/**
 * Why the game stopped.
 *
 * A forfeit is worded from the viewer's side: the player who walked out saw the
 * same screen as the one left behind, and telling them their opponent left would
 * be plainly wrong. `null` and any unrecognised reason fall through to "Board
 * filled", which is also what a turn timeout ends up recording.
 */
function reasonLabel(game: ResultGame) {
  if (game.endReason === "forfeit") {
    const viewerWon = game.viewerSlot !== null && game.winnerId === playerId(game, game.viewerSlot);
    if (game.viewerSlot === null) return "Forfeited";
    return viewerWon ? "Opponent left" : "You left the game";
  }
  if (game.endReason === "double-pass") return "Both players passed";
  return "Board filled";
}

function playerId(game: ResultGame, slot: 1 | 2) {
  return slot === 1 ? game.players.one?.id : game.players.two?.id;
}

/**
 * The viewer's star movement, if this game moved any.
 *
 * Nothing renders on an unranked game — the server stored a null delta because
 * one side was a guest, and a zero would read as having held your ground.
 */
function StarDelta({ game }: { game: ResultGame }) {
  const slot = game.viewerSlot;
  const delta = slot ? (game.starDeltas?.[slot] ?? null) : null;

  if (delta === null) return null;

  return (
    <p
      className={cn(
        "font-display mt-0.5 text-xs font-bold tabular-nums",
        delta > 0 ? "text-mint" : "text-muted-foreground",
      )}
    >
      {delta > 0 ? "+" : ""}
      {delta} stars
    </p>
  );
}
