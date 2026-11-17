"use client";
import { useAccount, useSession } from "@word-lock/client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { NewGameSheet } from "@/components/NewGameSheet";
import { StreakBadge, MedalBadge } from "@/components/StatPills";
import { cn } from "@/lib/utils";

/*
 * Flat button with a hard lip in a darker shade of its own fill (set per button
 * via `--lip`). Pressing sinks the face into the lip, like `soft-btn`.
 */
const CHUNKY =
  "flex items-center justify-center font-display font-semibold text-[#1A1110] transition-[transform,box-shadow] duration-75 disabled:cursor-not-allowed disabled:opacity-45";
const CHUNKY_MD =
  "h-[48px] flex-1 rounded-[20px] text-[17px] shadow-[0_5px_0_0_var(--lip)] active:enabled:translate-y-1 active:enabled:shadow-[0_1px_0_0_var(--lip)]";

export function LobbyClient() {
  const { ready } = useSession();
  const { data: account } = useAccount();
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Lock document scroll while home is mounted. Home is deliberately not `fixed`: iOS Safari
  // tints the status bar from a full-screen fixed layer and never re-samples it on a theme change.
  useEffect(() => {
    const els = [document.documentElement, document.body];
    els.forEach((e) => (e.style.overflow = "hidden"));
    // overflow alone doesn't stop the rubber-band, so swallow any drag that isn't
    // inside something that can actually scroll (e.g. a tall sheet's panel).
    const block = (e: TouchEvent) => {
      for (let n = e.target as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
        const oy = getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) return;
      }
      e.preventDefault();
    };
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      els.forEach((e) => (e.style.overflow = ""));
      document.removeEventListener("touchmove", block);
    };
  }, []);

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden">
      <div className="flex items-start justify-between px-8 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <div className="flex flex-col items-start gap-6">
          <StreakBadge />
          <MedalBadge />
        </div>
        <Link href="/profile" aria-label="Profile" className="rounded-full active:opacity-70">
          <Avatar avatar={account?.avatar} className="h-12 w-12" />
        </Link>
      </div>

      <section className="flex flex-1 flex-col items-center justify-center pb-[calc(11rem+env(safe-area-inset-bottom))]">
        <Link href="/" className="inline-flex" aria-label="Word-lock home">
          {/* Light theme gets logo-dark, dark theme gets logo. The hidden one is lazy, so it only loads when its theme shows. */}
          {/* eslint-disable @next/next/no-img-element */}
          <img
            src="/christmas/logo-dark.webp"
            alt=""
            width={600}
            height={446}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-[145px] w-[195px] select-none object-contain dark:hidden"
          />
          <img
            src="/christmas/logo.webp"
            alt=""
            width={600}
            height={446}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="hidden h-[145px] w-[195px] select-none object-contain dark:block"
          />
          {/* eslint-enable @next/next/no-img-element */}
        </Link>

        <div className="mt-11 flex w-full max-w-sm flex-row gap-5 px-6">
          <Chunky
            onClick={() => setNewGameOpen(true)}
            disabled={!ready}
            className={cn(CHUNKY_MD, "bg-[#FFC400] [--lip:#FFA600]")}
          >
            New game
          </Chunky>
          <Link
            href="/join"
            className={cn(
              CHUNKY,
              CHUNKY_MD,
              "bg-[#EBDFC0] [--lip:#C2B085] dark:bg-[#FBF6EC] dark:[--lip:#D8CDB4]",
            )}
          >
            Join
          </Link>
        </div>
      </section>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-end px-7 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
        <Chunky
          onClick={() => setRulesOpen(true)}
          className="pointer-events-auto h-10 rounded-[18px] bg-[#FFC400] px-5 text-sm [--lip:#FFA600] shadow-[0_3px_0_0_var(--lip)] active:enabled:translate-y-0.5 active:enabled:shadow-[0_1px_0_0_var(--lip)]"
        >
          How to play?
        </Chunky>
      </div>

      <HowToPlaySheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <NewGameSheet open={newGameOpen} onClose={() => setNewGameOpen(false)} />
    </main>
  );
}

function Chunky({
  className,
  ...props
}: {
  className: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return <button type="button" className={cn(CHUNKY, className)} {...props} />;
}
