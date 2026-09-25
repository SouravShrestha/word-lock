import { fetchProfileFn, useAccount, useSession } from "@word-lock/client";
import type { PlayerStats } from "@word-lock/core/game";
import { SettingsIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/IconButton";
import { OverviewCard } from "@/components/OverviewCard";
import { ProfileIdentity } from "@/components/ProfileIdentity";
import { SectionLabel } from "@/components/SectionLabel";
import { SettingsSheet } from "@/components/SettingsSheet";
import { StatisticsCard } from "@/components/StatisticsCard";
import { useTheme } from "@/theme/ThemeProvider";

export default function ProfileScreen() {
  const { sessionId, ready } = useSession();
  const { data: account } = useAccount();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const { data, isLoading } = useQuery<PlayerStats>({
    queryKey: ["profile", sessionId],
    enabled: ready && !!sessionId,
    queryFn: () => fetchProfileFn({ sessionId: sessionId! }),
  });

  const overview = data?.overview;
  const loading = !ready || isLoading;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="flex-row items-center justify-end gap-3 px-5 mt-5"
          style={{ paddingTop: Math.max(insets.top, 20) }}
        >
          <IconButton
            variant="surface"
            size={36}
            accessibilityLabel="Settings"
            onPress={() => setSettingsOpen(true)}
          >
            <SettingsIcon size={18} color={palette.foreground} />
          </IconButton>
        </View>

        <View className="mx-auto w-full max-w-sm gap-6 px-5">
          <ProfileIdentity
            username={account?.username}
            avatar={account?.avatar}
            joinedAt={account?.joinedAt}
          />

          <View className="gap-3">
            <SectionLabel>Overview</SectionLabel>
            <OverviewCard />
          </View>

          <View className="gap-3">
            <SectionLabel>Statistics</SectionLabel>
            {loading ? (
              <View className="h-10 rounded-sm bg-surface" />
            ) : overview && overview.total > 0 ? (
              <StatisticsCard starHistory={data!.starHistory} overview={overview} />
            ) : (
              <View className="items-center p-6">
                <Text className="font-display text-lg font-bold text-foreground">
                  No games finished yet
                </Text>
                <Text className="font-sans mt-1 text-sm text-mutedForeground">Go play one!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}
