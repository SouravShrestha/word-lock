import { useCallback, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { Tile, type TileOwner } from "@/components/Tile";
import { GRID_SIZE } from "@word-lock/core/game";

export function BoardGrid({
  grid,
  owners,
  locked,
  selection,
  disabled,
  onToggleTile,
}: {
  grid: string[];
  owners: TileOwner[];
  locked: boolean[];
  selection: number[];
  disabled: boolean;
  onToggleTile: (index: number) => void;
}) {
  const [side, setSide] = useState<number | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = Math.max(0, Math.floor(Math.min(width, height)));
    setSide((current) => (current === next ? current : next));
  }, []);

  return (
    <View className="flex-1 items-center justify-center" onLayout={onLayout}>
      {side !== null && side > 0 && (
        <View className="flex-row flex-wrap" style={{ width: side, height: side }}>
          {grid.map((letter, index) => {
            const highlighted = selection.indexOf(index);
            return (
              <View key={index} style={{ width: side / GRID_SIZE, height: side / GRID_SIZE }}>
                <Tile
                  letter={letter}
                  owner={owners[index]}
                  locked={locked[index]}
                  selected={highlighted !== -1}
                  order={highlighted !== -1 ? highlighted + 1 : null}
                  disabled={disabled}
                  onPress={() => onToggleTile(index)}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
