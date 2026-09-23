import { Text, View } from "react-native";
import { CrossIcon, LeagueIcon, LEAGUE_TEXT_COLOR } from "@word-lock/icons/native";
import { LEAGUES } from "@word-lock/core/account";

import { BottomSheet } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";

export function LeagueGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="League tiers" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4">
        <Text className="font-display text-xl font-bold text-foreground">League tiers</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <Text className="font-sans mt-3 text-[15px] text-mutedForeground">
        Climb the ladder by winning games and earning stars.
      </Text>

      <View className="mt-6 gap-2">
        {LEAGUES.map((tier) => (
          <View key={tier.id} className="flex-row items-center gap-4 rounded-md px-2 py-3">
            <LeagueIcon league={tier.id} size={48} />
            <View>
              <Text
                className="font-display text-base font-semibold tracking-wide"
                style={{ color: LEAGUE_TEXT_COLOR[tier.id] }}
              >
                {tier.name}
              </Text>
              <Text className="text-xs font-semibold tracking-wide text-mutedForeground">
                {tier.maxStars === null
                  ? `${tier.minStars}+ stars`
                  : `${tier.minStars} - ${tier.maxStars} stars`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
