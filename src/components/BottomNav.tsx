"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeNavIcon } from "@/components/icons/nav/HomeNavIcon";
import { HistoryNavIcon } from "@/components/icons/nav/HistoryNavIcon";
import { TrophyNavIcon } from "@/components/icons/nav/TrophyNavIcon";
import { ProfileNavIcon } from "@/components/icons/nav/ProfileNavIcon";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", Icon: HomeNavIcon, iconClassName: "h-7 w-7" },
  { href: "/history", label: "Matches", Icon: HistoryNavIcon, iconClassName: "h-10 w-10" },
  {
    href: "/leaderboard",
    label: "Leaderboards",
    Icon: TrophyNavIcon,
    iconClassName: "h-8 w-8",
  },
  { href: "/profile", label: "Profile", Icon: ProfileNavIcon, iconClassName: "h-7 w-7 mr-1" },
] as const;

/**
 * Height reserved for the bottom bar so scroll containers can pad themselves.
 * At `lg` the nav moves to the side, so the reservation is dropped.
 */
export const BOTTOM_NAV_SPACER = "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-8";

/**
 * Shell classes for pages that render <BottomNav />. At `lg` the nav becomes a
 * fixed 16rem sidebar, so the page reserves that space with left padding and
 * widens its max-width by the same amount to stay optically centered.
 */
export const NAV_SHELL =
  "relative mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden lg:max-w-[calc(42rem+16rem)] lg:pl-64";

/** Left edge of the content area, for elements pinned with `absolute inset-x-0`. */
export const NAV_CONTENT_INSET = "lg:left-64";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 border-t-2 border-hairline bg-background",
        "lg:fixed lg:inset-y-0 lg:right-auto lg:left-0 lg:w-64 lg:flex lg:flex-col",
        "lg:border-t-0 lg:border-r-2 lg:px-4 lg:py-7",
      )}
    >
      <ul className="mx-auto flex max-w-sm items-stretch pb-[env(safe-area-inset-bottom)] lg:mx-0 lg:max-w-none lg:flex-col lg:gap-1 lg:pb-0">
        {TABS.map(({ href, label, Icon, iconClassName }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 lg:flex-none">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative flex h-16 items-center justify-center lg:h-14 lg:justify-start lg:gap-3 lg:px-3"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-2 inset-x-6 rounded-sm border-2 border-border transition-opacity",
                    "lg:inset-x-0 lg:inset-y-0 lg:rounded-md",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="relative z-10 grid w-10 shrink-0 place-items-center">
                  <Icon
                    key={active ? pathname : undefined}
                    className={cn(iconClassName, active && "nav-bubble")}
                  />
                </span>
                <span
                  className={cn(
                    "relative z-10 hidden text-sm font-bold tracking-wide lg:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
