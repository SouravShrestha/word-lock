import { Text } from "@/components/text";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { PencilIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { AvatarSheet } from "@/components/AvatarSheet";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Native counterpart of `apps/web`'s `ProfileIdentity.tsx` — who you are,
 * at the top of the profile. The avatar is the one editable thing; the
 * username is claimable exactly once and shown read-only, same reasoning
 * as the web version for why the pencil sits on the picture rather than
 * the block as a whole.
 */
export function ProfileIdentity({
  username,
  avatar,
  joinedAt,
}: {
  username?: string | null;
  avatar?: string | null;
  /** ISO timestamp from the account summary. Absent while it is still loading. */
  joinedAt?: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [picking, setPicking] = useState(false);

  return (
    <View className="items-center gap-2 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change your avatar"
        onPress={() => setPicking(true)}
      >
        <View>
          <Avatar avatar={avatar} size={72} />
          <View
            className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.sky }}
          >
            <PencilIcon size={12} color={palette.background} />
          </View>
        </View>
      </Pressable>

      <Text variant="heading" numberOfLines={1} className="max-w-full px-3 text-center">
        {username ? `@${username}` : "…"}
      </Text>

      <Text variant="caption">
        {joinedAt ? `Joined ${new Date(joinedAt).getFullYear()}` : "\u00A0"}
      </Text>

      <AvatarSheet open={picking} onClose={() => setPicking(false)} current={avatar} />
    </View>
  );
}
