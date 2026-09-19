import Link from "next/link";

import { WordLockLogo } from "@/components/WordLockLogo";

export function Wordmark({
  size = "lg",
  stacked = false,
}: {
  size?: "lg" | "sm";
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <Link href="/" className="inline-flex" aria-label="Word-lock home">
        <WordLockLogo className="h-auto w-[17rem] select-none sm:w-80" />
      </Link>
    );
  }

  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link href="/" className={`wordmark inline-flex ${text}`} aria-label="Word-lock home">
      Word<span className="text-sky"> lock</span>
    </Link>
  );
}
