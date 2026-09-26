"use client";

import { useState } from "react";
import { BottomNav, BOTTOM_NAV_SPACER, NAV_SHELL } from "@/components/BottomNav";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { LeagueGuideSheet } from "@/components/LeagueGuideSheet";

export function LeaderboardClient() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <main className={NAV_SHELL}>
      <div className={`flex flex-1 flex-col overflow-y-auto ${BOTTOM_NAV_SPACER}`}>
        <LeaderboardCard onOpenGuide={() => setGuideOpen(true)} />
      </div>

      <LeagueGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />

      <BottomNav />
    </main>
  );
}
