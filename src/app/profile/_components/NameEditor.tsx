"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";

export function NameEditor({
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

  return (
    <section className="flex flex-col items-center gap-2 py-2">
      <div className="grid h-18 w-18 shrink-0 place-items-center rounded-full">
        <AvatarPandaIcon className="w-12 h-12 text-foreground" />
      </div>
      {editing ? (
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
          className="w-40 rounded-md border-2 border-foreground bg-card px-3 py-1.5 text-center text-lg font-bold text-foreground outline-none font-display"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Click to edit your name"
          className="text-center font-display text-lg font-bold truncate w-40 rounded-md border-2 border-foreground bg-card px-3 py-1.5"
        >
          {value || "Add your name"}
        </button>
      )}
    </section>
  );
}
