import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={`flex-row items-center gap-2.5 ${className ?? ""}`}>
      <View className="h-0.5 w-4 shrink-0 bg-hairline" />
      <Text className="shrink-0 text-sm font-semibold tracking-wider text-mutedForeground">
        {children}
      </Text>
      <View className="h-0.5 flex-1 bg-hairline" />
    </View>
  );
}
