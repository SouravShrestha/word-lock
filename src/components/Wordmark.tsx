import Link from "next/link";

import { WordLockLogo } from "@/components/WordLockLogo";

/**
 * The brand lockup, as a link home. Only the home screen renders it — the side
 * nav at `lg` is navigation, not a masthead, so it leads with the tabs instead.
 */
export function Wordmark() {
  return (
    <Link href="/" className="inline-flex" aria-label="Word-lock home">
      <WordLockLogo className="h-auto w-56 select-none" />
    </Link>
  );
}
