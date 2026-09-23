"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icons";
import { InviteIcon } from "@/components/icons/InviteIcon";

export function InviteFriends({ shareUrl, roomCode }: { shareUrl: string; roomCode: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const copy = (what: "link" | "code") => {
    navigator.clipboard?.writeText(what === "link" ? shareUrl : roomCode);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  const message = `Join my Word lock game: ${shareUrl}`;

  return (
    <ul className="no-scrollbar flex snap-x snap-mandatory overflow-x-scroll py-4">
      <Item first>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="surface press flex h-full flex-col items-center justify-center gap-2 p-3"
        >
          <InviteIcon className="h-5 w-5" />
          <span className="text-[0.7rem] font-bold">WhatsApp</span>
        </a>
      </Item>

      <Item>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Join my Word lock game")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="surface press flex h-full flex-col items-center justify-center gap-2 p-3"
        >
          <InviteIcon className="h-5 w-5" />
          <span className="text-[0.7rem] font-bold">Telegram</span>
        </a>
      </Item>

      <Item>
        <button
          type="button"
          onClick={() => copy("link")}
          className="surface press flex h-full w-full flex-col items-center justify-center gap-2 p-3"
        >
          {copied === "link" ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          <span className="text-[0.7rem] font-bold">Copy link</span>
        </button>
      </Item>

      <Item last>
        <button
          type="button"
          onClick={() => copy("code")}
          className="surface press flex h-full w-full flex-col items-center justify-center gap-2 p-3"
        >
          {copied === "code" ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          <span className="text-[0.7rem] font-bold">Copy code</span>
        </button>
      </Item>
    </ul>
  );
}

function Item({
  children,
  first,
  last,
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <li
      className={`h-24 w-24 shrink-0 snap-start ${first ? "pl-5" : "pl-2"} ${last ? "pr-5" : "pr-2"}`}
    >
      {children}
    </li>
  );
}
