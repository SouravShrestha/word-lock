import { Text } from "@/components/text";
import { useAccount, useAuth, useSession } from "@word-lock/client";
import {
  AppearanceIcon,
  CrossIcon,
  FeedbackIcon,
  MailIcon,
  ProfileIcon,
  ShieldCheckIcon,
} from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppearanceSheet, THEME_LABELS } from "@/components/AppearanceSheet";
import { BottomSheet, SheetTouchable } from "@/components/BottomSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconButton } from "@/components/IconButton";
import { SettingsInfoRow, SettingsRow } from "@/components/SettingsRow";
import { toast } from "@/components/Toast";
import { PRIVACY_URL, SUPPORT_EMAIL, supportMailto, siteUrl } from "@/lib/app-meta";
import { useTheme } from "@/theme/ThemeProvider";

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const iconColor = palette.foreground;
  const { ready, user, signOut } = useAuth();
  const { sessionId } = useSession();
  const { data: account } = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

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
        dismissable={!confirming && !appearanceOpen}
      >
        <View className="flex-row justify-end px-1 pt-7">
          <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
            <CrossIcon size={14} color="#ffffff" />
          </IconButton>
        </View>

        <View className="mt-8 gap-2 px-1">
          <SettingsInfoRow
            icon={<ProfileIcon size={16} color={iconColor} />}
            label="Username"
            value={account?.username ? `@${account.username}` : "…"}
          />
          <SettingsInfoRow
            icon={<MailIcon size={16} color={iconColor} />}
            label="Email"
            value={ready ? (user?.email ?? "Logged in") : "…"}
          />
          <SettingsRow
            icon={<AppearanceIcon size={16} color={iconColor} />}
            label="Appearance"
            value={THEME_LABELS[theme]}
            onPress={() => setAppearanceOpen(true)}
          />

          {PRIVACY_URL ? (
            <SettingsRow
              icon={<ShieldCheckIcon size={18} color={iconColor} />}
              label="Privacy policy"
              href={PRIVACY_URL.startsWith("/") ? `${siteUrl()}${PRIVACY_URL}` : PRIVACY_URL}
            />
          ) : null}
          <SettingsRow
            icon={<FeedbackIcon size={18} color={iconColor} />}
            label="Email us"
            value={SUPPORT_EMAIL}
            href={supportMailto()}
          />

          <SheetTouchable
            accessibilityRole="button"
            disabled={busy || !ready}
            onPress={() => setConfirming(true)}
            activeOpacity={0.6}
            className="mt-8 items-center rounded-2xl border py-4"
            style={{ borderColor: palette.border, opacity: busy || !ready ? 0.6 : 1 }}
          >
            <Text variant="bodyBase">{busy ? "Logging out" : "Log out"}</Text>
          </SheetTouchable>
        </View>
      </BottomSheet>

      <AppearanceSheet open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />

      <ConfirmDialog
        open={confirming}
        title="Log out?"
        description={
          "An account is needed to play, so you'll be locked out until you log back in.\nYour medals, streak and match history are kept safe on your account."
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
