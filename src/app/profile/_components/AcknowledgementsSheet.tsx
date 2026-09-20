"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { WORDLIST_URL } from "@/lib/app-meta";
import { SettingsGroup, SettingsRow } from "./SettingsRow";

/**
 * Credit for the things the game is built out of.
 *
 * The word list is the one that actually matters: every move in the game is
 * validated against `data/words_alpha.txt`, so the dictionary is a dependency
 * on the same level as the framework, not a footnote.
 */
const CREDITS: { label: string; hint: string; href: string }[] = [
  {
    label: "english-words",
    hint: "The dictionary every word is checked against",
    href: WORDLIST_URL,
  },
  { label: "Next.js", hint: "App framework", href: "https://nextjs.org" },
  { label: "Supabase", hint: "Database, realtime and accounts", href: "https://supabase.com" },
  { label: "Tailwind CSS", hint: "Styling", href: "https://tailwindcss.com" },
  { label: "Cloudflare Workers", hint: "Hosting, via OpenNext", href: "https://workers.dev" },
];

export function AcknowledgementsSheet({
  open,
  onClose,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  zClassName?: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Acknowledgements" zClassName={zClassName}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">Acknowledgements</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Word lock is built on open source. Thanks to everyone behind these.
      </p>

      <div className="mt-6">
        <SettingsGroup>
          {CREDITS.map((credit) => (
            <SettingsRow
              key={credit.label}
              label={credit.label}
              hint={credit.hint}
              href={credit.href}
            />
          ))}
        </SettingsGroup>
      </div>
    </BottomSheet>
  );
}
