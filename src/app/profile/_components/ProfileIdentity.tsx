"use client";

import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";

/**
 * Who you are, at the top of the profile.
 *
 * Read-only by design. This used to be an inline editor for a short in-game name
 * that sat alongside the username; that name is gone, and the username it
 * replaced it with is claimable exactly once. Rendering an edit affordance for a
 * field the server will refuse to change is worse than not offering one, so the
 * permanence is stated instead.
 */
export function ProfileIdentity({ username }: { username?: string | null }) {
  return (
    <section className="flex flex-col items-center gap-2 py-2">
      <div className="grid h-18 w-18 shrink-0 place-items-center rounded-full">
        <AvatarPandaIcon className="w-12 h-12 text-foreground" />
      </div>

      <p
        className="max-w-full truncate px-3 text-center font-display text-lg font-bold"
        title={username ?? undefined}
      >
        {username ? `@${username}` : "…"}
      </p>

      <p className="text-xs font-semibold text-muted-foreground">
        This is how other players see you
      </p>
    </section>
  );
}
