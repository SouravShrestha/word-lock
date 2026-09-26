import { Text } from "@/components/text";
import { useAccount, useAuth, useSession } from "@word-lock/client";
import { browserTimezone } from "@word-lock/core/account";
import { CrossIcon } from "@word-lock/icons/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AboutSheet } from "@/components/AboutSheet";
import { AcknowledgementsSheet } from "@/components/AcknowledgementsSheet";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { IconButton } from "@/components/IconButton";
import { LeagueGuideSheet } from "@/components/LeagueGuideSheet";
import { SectionLabel } from "@/components/SectionLabel";
import { SettingsField, SettingsGroup, SettingsRow } from "@/components/SettingsRow";
import { toast } from "@/components/Toast";
import { Toggle } from "@/components/Toggle";
import { PRIVACY_URL, supportMailto, TERMS_URL, siteUrl } from "@/lib/app-meta";
import { useTheme } from "@/theme/ThemeProvider";

type Nested = "rules" | "leagues" | "about" | "credits" | null;

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { ready, user, signOut } = useAuth();
  const { sessionId } = useSession();
  const { data: account } = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [nested, setNested] = useState<Nested>(null);

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setConfirming(false);
      onClose();
      router.push("/");
    } catch {
      toast.error("Couldn't log out. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        label="Settings"
        showHandle={false}
        dismissable={nested === null && !confirming}
      >
        <View className="flex-row items-center justify-between gap-4 px-1 pt-7">
          <Text variant="sheetTitle">Settings</Text>
          <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
            <CrossIcon size={14} color="#ffffff" />
          </IconButton>
        </View>

        <View className="mt-8 gap-6 px-1">
          <View className="gap-3">
            <SectionLabel>Preferences</SectionLabel>
            <SettingsGroup>
              <View className="flex-row items-center gap-3.5 px-2 py-4">
                <View className="min-w-0 flex-1">
                  <Text variant="label">Dark theme</Text>
                  <Text variant="caption" className="mt-0.5">
                    Easier on the eyes
                  </Text>
                </View>
                <Toggle
                  label="Dark theme"
                  checked={theme === "dark"}
                  onChange={(next) => setTheme(next ? "dark" : "light")}
                />
              </View>

              <SettingsField
                label="Time zone"
                value={browserTimezone() ?? "UTC"}
                hint="Taken from your device."
              />
            </SettingsGroup>
          </View>

          <View className="gap-3">
            <SectionLabel>Account</SectionLabel>
            <SettingsGroup>
              <SettingsField
                label="Username"
                value={account?.username ? `@${account.username}` : "…"}
                hint="Usernames are permanent and can't be changed."
              />
              <SettingsField label="Email" value={ready ? (user?.email ?? "Logged in") : "…"} />
            </SettingsGroup>
          </View>

          <View className="gap-3">
            <SectionLabel>Guides</SectionLabel>
            <SettingsGroup>
              <SettingsRow label="How to play" onPress={() => setNested("rules")} />
              <SettingsRow label="League tiers" onPress={() => setNested("leagues")} />
            </SettingsGroup>
          </View>

          <View className="gap-3">
            <SectionLabel>Support</SectionLabel>
            <SettingsGroup>
              <SettingsRow label="About" onPress={() => setNested("about")} />
              {PRIVACY_URL ? (
                <SettingsRow
                  label="Privacy policy"
                  href={PRIVACY_URL.startsWith("/") ? `${siteUrl()}${PRIVACY_URL}` : PRIVACY_URL}
                />
              ) : null}
              {TERMS_URL ? (
                <SettingsRow
                  label="Terms of service"
                  href={TERMS_URL.startsWith("/") ? `${siteUrl()}${TERMS_URL}` : TERMS_URL}
                />
              ) : null}
              <SettingsRow label="Email us" href={supportMailto()} />
              <SettingsRow label="Acknowledgements" onPress={() => setNested("credits")} />
            </SettingsGroup>
          </View>

          <Button
            variant="surface2"
            disabled={busy || !ready}
            loading={busy}
            onPress={() => setConfirming(true)}
          >
            Log out
          </Button>
        </View>
      </BottomSheet>

      <HowToPlaySheet open={nested === "rules"} onClose={() => setNested(null)} />
      <LeagueGuideSheet open={nested === "leagues"} onClose={() => setNested(null)} />
      <AboutSheet open={nested === "about"} onClose={() => setNested(null)} />
      <AcknowledgementsSheet open={nested === "credits"} onClose={() => setNested(null)} />

      <ConfirmDialog
        open={confirming}
        title="Log out?"
        description={
          "An account is needed to play, so you'll be locked out until you log back in.\nYour stars, streak and match history are kept safe on your account."
        }
        confirmLabel="Log out"
        pendingLabel="Logging out…"
        onConfirm={onSignOut}
        onCancel={() => setConfirming(false)}
        isPending={busy}
      />
    </>
  );
}
