import { Text } from "@/components/text";
import type { ReactNode } from "react";
import { View } from "react-native";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={`flex-row items-center gap-2.5 ${className ?? ""}`}>
      <View className="h-0.5 w-4 shrink-0 bg-hairline" />
      <Text variant="eyebrow" className="shrink-0">
        {children}
      </Text>
      <View className="h-0.5 flex-1 bg-hairline" />
    </View>
  );
}
