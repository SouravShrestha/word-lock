import { colors } from "@word-lock/tokens/native";
import { Link } from "expo-router";

import { WordLockLogo } from "@/components/WordLockLogo";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Native counterpart of `apps/web`'s `Wordmark.tsx` — the logo, linked home.
 * `expo-router`'s `Link` to `/` plays the same role `next/link` does there;
 * the tab navigator resolves `/` to the `(tabs)/index` screen the same way
 * Next resolves it to the app's root page.
 */
export function Wordmark({ width = 224 }: { width?: number }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <Link href="/" accessibilityLabel="Word Lock home" accessibilityRole="link">
      <WordLockLogo width={width} fillColor={palette.foreground} />
    </Link>
  );
}
