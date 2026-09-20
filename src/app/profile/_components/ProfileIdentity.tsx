"use client";

import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { AvatarSheet } from "./AvatarSheet";

/**
 * Who you are, at the top of the profile.
 *
 * The avatar is the one editable thing here. The username is not: it is claimable
 * exactly once, and rendering an edit affordance for a field the server will
 * refuse to change is worse than not offering one, so the permanence is stated
 * instead. That asymmetry is the reason the pencil sits on the picture rather
 * than on the block as a whole.
 */
export function ProfileIdentity({
  username,
  avatar,
}: {
  username?: string | null;
  avatar?: string | null;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <section className="flex flex-col items-center gap-2 py-2">
      <button
        type="button"
        onClick={() => setPicking(true)}
        aria-label="Change your avatar"
        className="press relative rounded-full"
      >
        <Avatar avatar={avatar} className="h-18 w-18" />
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-sky text-background"
        >
          <PencilIcon className="h-3 w-3" />
        </span>
      </button>

      <p
        className="max-w-full truncate px-3 text-center font-display text-lg font-bold"
        title={username ?? undefined}
      >
        {username ? `@${username}` : "…"}
      </p>

      <p className="text-xs font-semibold text-muted-foreground">
        This is how other players see you
      </p>

      <AvatarSheet open={picking} onClose={() => setPicking(false)} current={avatar} />
    </section>
  );
}
