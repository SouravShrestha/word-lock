import { Text, View } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

/** Matches `soft-btn`'s default `--btn-lip: 4px`, which the web's badge inherits. */
const BADGE_LIP = 4;

/** The face, `h-7 w-7` on the web and on this platform. */
const FACE = 28;

/** `soft-btn`'s `border-radius: 0.55rem`, rounded to the nearest px. */
const RADIUS = 8;

/** The web's `mt-0.5`, nudging the badge down onto the rule title's baseline. */
const NUDGE = 2;

/**
 * The numbered chip beside each rule, shared by `HowToPlaySheet` and the
 * public `/how-to-play` screen — the same two places the web renders it
 * (`soft-btn btn-sun mt-0.5 h-7 w-7 shrink-0 text-xs`), extracted here
 * rather than written twice because the extruded lip is more than a class
 * name on this platform.
 *
 * Unlike every other extruded surface in the app, this one does **not** use
 * `lip.tsx`. That primitive paints the depth colour as an absolutely
 * positioned sibling spanning `top: "50%"` to `bottom: 0`, and reserves the
 * visible band with bottom padding on an auto-height container — geometry
 * that exists so a *control* can sink into its lip on press without changing
 * height (see `lipPadding`). Rendered here it came out visibly flat while
 * `Button` and `IconButton` on the same screen did not, and the mechanism has
 * more moving parts than this badge needs to begin with.
 *
 * A badge is a label, not a control: it never sinks, so nothing has to be
 * repositioned on press, and the lip can just be the container's own
 * background with the face drawn on top of it. Two nested solid boxes with
 * fixed sizes — no absolute positioning, no percentage resolved against an
 * auto-height parent, no padding standing in for a thickness. The visible
 * band is `height - FACE` by construction.
 *
 * Sizes are inline `style` numbers rather than Tailwind classes because the
 * two boxes' heights have to agree exactly for the band to come out at
 * `BADGE_LIP`; `FACE` and `BADGE_LIP` being the same two constants in both
 * places is what guarantees that. Text styling stays on `className`, since a
 * `Text` has no box geometry to keep in step.
 */
export function RuleNumber({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <View
      style={{
        marginTop: NUDGE,
        flexShrink: 0,
        alignSelf: "flex-start",
        width: FACE,
        height: FACE + BADGE_LIP,
        borderRadius: RADIUS,
        backgroundColor: palette.depthSun,
      }}
    >
      <View
        style={{
          width: FACE,
          height: FACE,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.sun,
          borderRadius: RADIUS,
        }}
      >
        <Text className="font-display text-xs font-bold" style={{ color: palette.onAccent }}>
          {children}
        </Text>
      </View>
    </View>
  );
}
