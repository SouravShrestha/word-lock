import { Text, View } from "react-native";
import { CrossIcon } from "@word-lock/icons/native";

import { BottomSheet } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { SettingsGroup, SettingsRow } from "@/components/SettingsRow";
import { WORDLIST_URL } from "@/lib/app-meta";

const CREDITS: { label: string; hint: string; href: string }[] = [
  {
    label: "english-words",
    hint: "The dictionary every word is checked against",
    href: WORDLIST_URL,
  },
  { label: "Next.js", hint: "Web app framework", href: "https://nextjs.org" },
  { label: "Expo", hint: "This app's framework", href: "https://expo.dev" },
  { label: "Supabase", hint: "Database, realtime and accounts", href: "https://supabase.com" },
  { label: "Cloudflare Workers", hint: "Web hosting, via OpenNext", href: "https://workers.dev" },
];

export function AcknowledgementsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Acknowledgements" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4">
        <Text className="font-display text-lg text-foreground">Acknowledgements</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <Text className="font-sans mt-3 text-sm text-mutedForeground">
        Word lock is built on open source. Thanks to everyone behind these.
      </Text>

      <View className="mt-6 -mx-2">
        <SettingsGroup>
          {CREDITS.map((credit) => (
            <SettingsRow
              key={credit.label}
              label={credit.label}
              hint={credit.hint}
              href={credit.href}
            />
          ))}
        </SettingsGroup>
      </View>
    </BottomSheet>
  );
}
