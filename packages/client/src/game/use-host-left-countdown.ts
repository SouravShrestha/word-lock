"use client";

import { useEffect, useState } from "react";

/**
 * A 5-second countdown shown when the host destroys a waiting lobby out from
 * under a joined guest, before `onExpire` (a redirect home) runs. Was
 * duplicated verbatim between the web and mobile game screens.
 */
export function useHostLeftCountdown(onExpire: () => void) {
  const [hostLeftCountdown, setHostLeftCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (hostLeftCountdown === null) return;

    if (hostLeftCountdown === 0) {
      onExpire();
      return;
    }

    const timer = setTimeout(() => setHostLeftCountdown((count) => (count ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [hostLeftCountdown, onExpire]);

  return { hostLeftCountdown, startHostLeftCountdown: () => setHostLeftCountdown(5) };
}
