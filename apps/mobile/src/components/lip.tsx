import { View } from "react-native";

export function lipPadding(
  lip: number,
  pressed = false,
): { paddingTop: number; paddingBottom: number } {
  return {
    paddingTop: pressed ? lip - 1 : 0,
    paddingBottom: pressed ? 1 : lip,
  };
}

export function Lip({ depth }: { depth: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: depth,
      }}
    />
  );
}
