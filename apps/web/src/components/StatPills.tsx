"use client";

import Link from "next/link";
import { useState } from "react";

import { StreakIcon } from "@/components/icons/StreakIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { StreakSheet } from "@/components/StreakSheet";
import { useAccount } from "@word-lock/client";
import { browserTimezone } from "@word-lock/core/account";
import { currentStreak, localDate } from "@word-lock/core/game";
import { cn } from "@/lib/utils";

function useStreak() {
  const { data } = useAccount();
  const stored = data?.playStreak ?? 0;
  const lastPlayedOn = data?.lastPlayedOn ?? null;
  const lastFreezeOn = data?.lastFreezeOn ?? null;
  const today = localDate(new Date(), browserTimezone());
  const value = currentStreak(
    { play_streak: stored, last_played_on: lastPlayedOn, last_freeze_on: lastFreezeOn },
    today,
  );
  return { stored, lastPlayedOn, lastFreezeOn, value };
}

export function StreakPill() {
  const [open, setOpen] = useState(false);
  const { stored, lastPlayedOn, lastFreezeOn, value } = useStreak();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="stat-pill press tv-body text-streak"
      >
        <StreakIcon className="h-6 w-6" />
        <span className="-ml-1 pt-1 tv-body-base">{value}</span>
      </button>

      <StreakSheet
        open={open}
        onClose={() => setOpen(false)}
        playStreak={stored}
        lastPlayedOn={lastPlayedOn}
        lastFreezeOn={lastFreezeOn}
      />
    </>
  );
}

export function StarsPill() {
  const { data } = useAccount();
  const value = data?.stars ?? 0;

  return (
    <span className="stat-pill tv-body text-mint" title={`${value} medals`}>
      <StarIcon className="h-6 w-6" />
      <span className="tv-body-base -ml-1">{value}</span>
    </span>
  );
}

/*
 * Christmas home badges (Figma "Christmas - Light"): a 64px card with a label
 * band and a hard 4px base, the mascot breaking out of the top edge. Fixed
 * colours, so both themes match the mockup.
 */
function Badge({
  src,
  imageClassName,
  faceClassName,
  bandClassName,
  baseColor,
  label,
}: {
  src: string;
  imageClassName: string;
  faceClassName: string;
  bandClassName: string;
  baseColor: string;
  label: string;
}) {
  /* The 64×84 Figma art scaled to 85%; the outer box is sized to the result so layout shrinks too. */
  return (
    <span className="relative block h-[71px] w-[54px]">
      <span className="absolute left-0 top-0 block h-21 w-16 origin-top-left scale-[0.85]">
        <span
          className={cn(
            "absolute top-4 flex h-16 w-16 flex-col overflow-hidden rounded-2xl",
            faceClassName,
          )}
          style={{ boxShadow: `0 4px 0 0 ${baseColor}` }}
        >
          <span className="flex-1" />
          <span
            className={cn(
              "flex h-6 items-center justify-center font-display text-[13px] font-bold text-white",
              bandClassName,
            )}
          >
            {label}
          </span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn("absolute object-contain select-none", imageClassName)}
        />
      </span>
    </span>
  );
}

export function StreakBadge() {
  const [open, setOpen] = useState(false);
  const { stored, lastPlayedOn, lastFreezeOn, value } = useStreak();
  const label = String(value).padStart(2, "0");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${value} day streak`}
        className="press"
      >
        <Badge
          src="/christmas/streak.png"
          imageClassName="left-2.5 -top-0.5 h-[51px] w-11"
          faceClassName="bg-[linear-gradient(180deg,#FF7A00,#FF3A1A)]"
          bandClassName="bg-[#E40049]"
          baseColor="#9E0033"
          label={label}
        />
      </button>

      <StreakSheet
        open={open}
        onClose={() => setOpen(false)}
        playStreak={stored}
        lastPlayedOn={lastPlayedOn}
        lastFreezeOn={lastFreezeOn}
      />
    </>
  );
}

export function MedalBadge() {
  const { data } = useAccount();
  const value = data?.stars ?? 0;

  return (
    <Link href="/history" aria-label={`${value} medals, match history`} className="press block">
      <Badge
        src="/christmas/trophy.png"
        imageClassName="left-1.5 -top-[3px] h-[53px] w-[52px]"
        faceClassName="bg-[linear-gradient(180deg,#8B1EFF,#6A10CC)]"
        bandClassName="bg-[#4B008B]"
        baseColor="#2E0057"
        label={String(value)}
      />
    </Link>
  );
}
