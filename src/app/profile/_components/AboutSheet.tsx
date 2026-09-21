"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import {
  APP_VERSION,
  AUTHOR_NAME,
  AUTHOR_URL,
  CHANGELOG_URL,
  LICENSE_URL,
  REPO_URL,
} from "@/lib/app-meta";
import { SettingsGroup, SettingsRow } from "./SettingsRow";

/**
 * About. The build a player is looking at, and where the project lives.
 *
 * The version is the load-bearing part: it is the first thing worth knowing in
 * a bug report, and it is inlined from package.json at build time so it cannot
 * drift from the release that shipped.
 *
 * The wordmark is plain text here rather than <Wordmark />, which is a link home
 * — navigating out of a sheet the player opened to read is not what a heading
 * should do.
 */
export function AboutSheet({
  open,
  onClose,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  zClassName?: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="About" zClassName={zClassName}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg pl-2">About</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-8 flex flex-col items-start gap-1 text-center px-2">
        <p className="text-xs font-semibold text-muted-foreground">Version {APP_VERSION}</p>
      </div>

      <div className="mt-4">
        <SettingsGroup>
          <SettingsRow label="Made by" hint={AUTHOR_NAME} href={AUTHOR_URL} />
          <SettingsRow label="What's new" hint="Release notes" href={CHANGELOG_URL} />
          <SettingsRow label="Source code" hint="GitHub" href={REPO_URL} />
          <SettingsRow label="License" hint="MIT" href={LICENSE_URL} />
        </SettingsGroup>
      </div>
    </BottomSheet>
  );
}
