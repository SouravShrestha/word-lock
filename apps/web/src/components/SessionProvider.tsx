"use client";

import {
  ClientPlatformProvider,
  SessionProvider as SharedSessionProvider,
} from "@word-lock/client";

import { webPlatform } from "@/lib/client-platform";

/**
 * The session id, over the browser's storage.
 *
 * The platform provider is mounted here rather than in `layout.tsx` because it
 * exists only to serve the session state machine, and keeping them together means
 * there is no way to mount one without the other.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClientPlatformProvider platform={webPlatform}>
      <SharedSessionProvider>{children}</SharedSessionProvider>
    </ClientPlatformProvider>
  );
}
