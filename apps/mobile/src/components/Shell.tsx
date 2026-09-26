import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The game board's frame — the native counterpart of `apps/web`'s
 * `Shell.tsx`. The web version is `h-[100dvh] ... px-3 pt-3
 * pb-[calc(0.5rem+env(safe-area-inset-bottom))]`; there is no `dvh` unit and
 * no `env()` in React Native, so the same layout is built from a full-height
 * `View` with `useSafeAreaInsets()` supplying the one inset the web version
 * needed a CSS function for.
 *
 * Padding top is a plain `12` (the `pt-3` the web version uses, at 4px per
 * Tailwind unit) rather than adding a top safe-area inset: like the web
 * version, this shell has no header of its own — `GameBottomBar` in Task 16
 * carries every in-game control, so the top of the screen is free to sit under
 * the status bar/notch the same way `Shell.tsx`'s comment says it does today
 * (no separate top gutter reserved for one).
 */
export function Shell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="mx-auto w-full max-w-2xl flex-1 px-3 bg-background"
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {children}
    </View>
  );
}
