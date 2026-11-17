import { HomeNavIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { Tabs, usePathname } from "expo-router";
import type { ComponentType } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavBubble, NavBubbleOutline } from "@/components/NavBubble";
import { useTheme } from "@/theme/ThemeProvider";

const ICON_SIZES = { home: 28 } as const;

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
          // Home matches the "Christmas - Light" mockup, which has no tab bar.
          tabBarStyle: { display: "none" },
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
    </Tabs>
  );
}
