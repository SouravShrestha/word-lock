"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ReactionFlash {
  key: number;
  emoji: string;
  slot: 1 | 2;
}

const FLASH_DURATION_MS = 2000;

/**
 * Shows an opponent's emoji reaction over the board for a fixed duration.
 * Was duplicated verbatim between the web and mobile game screens.
 */
export function useReactionFlash() {
  const [activeReaction, setActiveReaction] = useState<ReactionFlash | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showReaction = useCallback((emoji: string, slot: 1 | 2) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveReaction({ key: Date.now(), emoji, slot });
    timerRef.current = setTimeout(() => setActiveReaction(null), FLASH_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { activeReaction, showReaction };
}
