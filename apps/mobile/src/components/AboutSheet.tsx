import { Text } from "@/components/text";
import { View } from "react-native";
import { CrossIcon } from "@word-lock/icons/native";

import { BottomSheet } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { SettingsGroup, SettingsRow } from "@/components/SettingsRow";
import {
  APP_VERSION,
  AUTHOR_NAME,
  AUTHOR_URL,
  CHANGELOG_URL,
  LICENSE_URL,
  REPO_URL,
} from "@/lib/app-meta";

export function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="About" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4">
        <Text variant="autoGen8">About</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View className="mt-8">
        <Text variant="caption">Version {APP_VERSION}</Text>
      </View>

      <View className="mt-4 -mx-2">
        <SettingsGroup>
          <SettingsRow label="Made by" hint={AUTHOR_NAME} href={AUTHOR_URL} />
          <SettingsRow label="What's new" hint="Release notes" href={CHANGELOG_URL} />
          <SettingsRow label="Source code" hint="GitHub" href={REPO_URL} />
          <SettingsRow label="License" hint="MIT" href={LICENSE_URL} />
        </SettingsGroup>
      </View>
    </BottomSheet>
  );
}
