import {
  HistoryNavIcon,
  HomeNavIcon,
  ProfileNavIcon,
  TrophyNavIcon,
} from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { Tabs, usePathname } from "expo-router";
import type { ComponentType } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavBubble, NavBubbleOutline } from "@/components/NavBubble";
import { useTheme } from "@/theme/ThemeProvider";

const ICON_SIZES = { home: 28, history: 40, leaderboard: 31, profile: 27 } as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavIconBubble({
  Icon,
  size,
  href,
  borderColor,
  backgroundColor,
  className,
}: {
  Icon: ComponentType<{ size?: number }>;
  size: number;
  href: string;
  borderColor: string;
  backgroundColor: string;
  className?: string;
}) {
  const pathname = usePathname();
  const focused = isActive(pathname, href);

  return (
    <View
      className={`items-center justify-center${className ? ` ${className}` : ""}`}
      style={{ width: 46, height: 46 }}
    >
      <NavBubbleOutline
        focused={focused}
        borderColor={borderColor}
        backgroundColor={backgroundColor}
      />
      <NavBubble focused={focused}>
        <Icon size={size} />
      </NavBubble>
    </View>
  );
}

export default function TabsLayout() {
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const palette = colors[resolvedTheme];

  return (
    <Tabs
      backBehavior="none"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: palette.foreground,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.hairline,
          borderTopWidth: 2,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => (
            <NavIconBubble
              Icon={HomeNavIcon}
              size={ICON_SIZES.home}
              href="/"
              borderColor={palette.navActiveBorder}
              backgroundColor={palette.navActive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Matches",
          tabBarIcon: () => (
            <NavIconBubble
              Icon={HistoryNavIcon}
              size={ICON_SIZES.history}
              href="/history"
              borderColor={palette.navActiveBorder}
              backgroundColor={palette.navActive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboards",
          tabBarIcon: () => (
            <NavIconBubble
              Icon={TrophyNavIcon}
              size={ICON_SIZES.leaderboard}
              href="/leaderboard"
              borderColor={palette.navActiveBorder}
              backgroundColor={palette.navActive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => (
            <NavIconBubble
              Icon={ProfileNavIcon}
              size={ICON_SIZES.profile}
              href="/profile"
              borderColor={palette.navActiveBorder}
              backgroundColor={palette.navActive}
              className="pr-1"
            />
          ),
        }}
      />
    </Tabs>
  );
}
