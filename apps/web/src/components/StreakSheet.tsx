"use client";

import { CrossIcon } from "@/components/icons/CrossIcon";
import { TickIcon } from "@/components/icons/TickIcon";
import { BottomSheet } from "@/components/BottomSheet";
import { browserTimezone } from "@word-lock/core/account";
import { currentStreak, localDate, streakMessage, streakWeek } from "@word-lock/core/game";
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
  lastFreezeOn,
}: {
  open: boolean;
  onClose: () => void;
  playStreak: number;
  lastPlayedOn: string | null;
  lastFreezeOn: string | null;
}) {
  const today = localDate(new Date(), browserTimezone());
  const state = {
    play_streak: playStreak,
    last_played_on: lastPlayedOn,
    last_freeze_on: lastFreezeOn,
  };
  const days = streakWeek(state, today);
  const footer = streakMessage(state, today);

  return (
    <BottomSheet open={open} onClose={onClose} label="Streak">
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between px-6">
        <div className="font-display font-bold leading-none text-streak">
          <p className="text-6xl">{String(currentStreak(state, today)).padStart(2, "0")}</p>
          <p className="mt-2 text-lg">day streak!</p>
        </div>
        <img src="/christmas/streak.png" alt="" className="h-24 w-[83px] object-contain" />
      </div>

      <div className="mt-12 flex flex-col items-center">
        <ol className="flex items-end gap-2">
          {days.map((day) => (
            <li key={day.date} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "tv-caption font-bold",
                  day.isToday ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {day.label}
              </span>
              <span
                // The label letters repeat across a week, so the cell carries
                // the full date and outcome for screen readers.
                aria-label={`${day.date}${day.played ? " played" : day.frozen ? " frozen" : " not played"}`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  day.played ? "bg-leaf text-white" : day.frozen ? "bg-freeze" : "bg-surface-2",
                  // reads as "this is the one you can still fill in".
                  day.isToday && "ring-2 ring-offset-2 ring-offset-background",
                  day.isToday &&
                    (day.played
                      ? "ring-leaf-deep"
                      : day.frozen
                        ? "ring-freeze-deep"
                        : "ring-streak"),
                )}
              >
                {day.played && <TickIcon className="h-4 w-4" />}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-8 w-full whitespace-pre-line pr-6 text-right tv-body leading-relaxed text-muted-foreground">
          {footer}
        </p>
      </div>
    </BottomSheet>
  );
}
