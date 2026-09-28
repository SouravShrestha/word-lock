"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="tv-subheading tracking-tight text-foreground">This page didn&apos;t load</h1>
        <p className="mt-2 tv-body text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => reset()} className="soft-btn btn-primary px-4 py-2">
            Try again
          </button>
          <Link href="/" className="soft-btn btn-surface px-4 py-2">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
