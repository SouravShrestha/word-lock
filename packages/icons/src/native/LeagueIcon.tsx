import { useId } from "react";
import { type LeagueId } from "@word-lock/core/account";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import {
  LEAGUE_CORE_PATH,
  LEAGUE_FACE_PATH,
  LEAGUE_PALETTES,
  LEAGUE_SHELL_PATH,
  LEAGUE_WINGS,
} from "../leagueIconData";
import { DEFAULT_ICON_SIZE } from "../types";

export interface LeagueIconProps {
  league: LeagueId;
  size?: number;
}

export function LeagueIcon({ league, size = DEFAULT_ICON_SIZE }: LeagueIconProps) {
  const uid = useId().replace(/:/g, "");
  const palette = LEAGUE_PALETTES[league];

  const gid = (name: string) => `league-${uid}-${name}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 190 190"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {LEAGUE_WINGS.map((wing, i) => (
        <Path key={i} d={wing.d} fill={`url(#${gid(`wing${i}`)})`} />
      ))}
      <Path d={LEAGUE_SHELL_PATH} fill={`url(#${gid("shell")})`} />
      <Path d={LEAGUE_FACE_PATH} fill={`url(#${gid("face")})`} />
      <Path d={LEAGUE_CORE_PATH} fill={`url(#${gid("core")})`} />

      <Defs>
        {LEAGUE_WINGS.map((wing, i) => (
          <LinearGradient
            key={i}
            id={gid(`wing${i}`)}
            x1={wing.axis[0]}
            y1={wing.axis[1]}
            x2={wing.axis[2]}
            y2={wing.axis[3]}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.5" stopColor={palette.wing[0]} />
            <Stop offset="1" stopColor={palette.wing[1]} />
          </LinearGradient>
        ))}

        <LinearGradient
          id={gid("shell")}
          x1="94.9963"
          y1="162.328"
          x2="94.9963"
          y2="27.6762"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={palette.shell[0]} />
          <Stop offset="1" stopColor={palette.shell[1]} />
        </LinearGradient>

        <LinearGradient
          id={gid("face")}
          x1="95"
          y1="153.048"
          x2="95"
          y2="36.9554"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={palette.face[0]} />
          <Stop offset="1" stopColor={palette.face[1]} />
        </LinearGradient>

        <LinearGradient
          id={gid("core")}
          x1="95"
          y1="130.256"
          x2="95"
          y2="59.748"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={palette.core[0]} />
          <Stop offset="1" stopColor={palette.core[1]} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
