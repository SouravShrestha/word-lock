"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";

export function NameBadge({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next) onChange(next);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={7}
        onChange={(e) => setDraft(e.target.value.replace(/\s+/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-40 rounded-md border-[2px] border-foreground bg-card px-4 py-1.5 text-base font-bold text-foreground outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit your name"
      className="chunky-btn flex items-center gap-2 bg-card px-4 py-1.5 text-sm text-foreground"
    >
      <AvatarPandaIcon className="w-5 h-5 text-foreground" />
      <span>{value || "Add your name"}</span>
    </button>
  );
}
