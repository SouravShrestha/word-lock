"use client";

import { CrossIcon } from "@/components/icons/CrossIcon";
import { TickIcon } from "@/components/icons/TickIcon";
import { StreakIcon } from "@/components/icons/StreakIcon";
import { BottomSheet } from "@/components/BottomSheet";
import { browserTimezone } from "@word-lock/core/account";
import { isGracePeriodActive, localDate, streakWeek } from "@word-lock/core/game";
import { cn } from "@/lib/utils";

/**
 * The weekly view behind the streak pill: the trailing seven days with the ones
 * the current streak covers ticked off.
 *
 * `today` is resolved in the browser's timezone with the same `localDate` the
 * server uses to advance the streak, so the row cannot disagree with the count
 * above it for a player sitting near a day boundary.
 */
export function StreakSheet({
  open,
  onClose,
  playStreak,
  lastPlayedOn,
}: {
  open: boolean;
  onClose: () => void;
  playStreak: number;
  lastPlayedOn: string | null;
}) {
  const today = localDate(new Date(), browserTimezone());
  const days = streakWeek({ play_streak: playStreak, last_played_on: lastPlayedOn }, today);
  const playedToday = lastPlayedOn === today;
  const isGrace = isGracePeriodActive(
    { play_streak: playStreak, last_played_on: lastPlayedOn },
    today,
  );

  const footer =
    playStreak === 0
      ? "Play a game today to start your streak."
      : playedToday
        ? "You're on a roll! Come back tomorrow to keep your streak going."
        : isGrace
          ? "Play a game today to keep your streak going, you used a grace!"
          : "Play a game today to keep your streak going.";

  return (
    <BottomSheet open={open} onClose={onClose} label="Streak">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">Streak</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <StreakIcon className="h-28 w-28 pl-5" />

        <p className="mt-6 text-2xl font-bold">
          {playStreak === 1 ? "1 Day Streak!" : `${playStreak} Day Streak!`}
        </p>

        <ol className="mt-6 flex items-end gap-2">
          {days.map((day) => (
            <li key={day.date} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-bold",
                  day.isToday ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {day.label}
              </span>
              <span
                // The label letters repeat across a week, so the cell carries
                // the full date and outcome for screen readers.
                aria-label={`${day.date}${day.played ? " played" : " not played"}`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  day.played ? "bg-leaf text-white" : "bg-surface-2",
                  // Today gets an outline either way, so an unticked cell still
                  // reads as "this is the one you can still fill in".
                  day.isToday && "ring-2 ring-[#FC9502] ring-offset-2 ring-offset-background",
                )}
              >
                {day.played && <TickIcon className="h-4 w-4" />}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">{footer}</p>
      </div>
    </BottomSheet>
  );
}
