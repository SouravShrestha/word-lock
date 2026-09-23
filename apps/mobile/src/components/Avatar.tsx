import { avatarUrl } from "@word-lock/core/account";
import { Image } from "expo-image";
import { View } from "react-native";

export function Avatar({
  avatar,
  size = 56,
  className,
}: {
  avatar: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const src = avatarUrl(avatar);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`shrink-0 overflow-hidden rounded-full bg-surface2 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          source={src}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="disk"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}
