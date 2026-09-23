import { useCallback, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@word-lock/tokens/native";
import { BackspaceIcon } from "@word-lock/icons/native";

import { useTheme } from "@/theme/ThemeProvider";

const NUMBER_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;
const ROW1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"] as const;
const ROW2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"] as const;
const ROW3 = ["Z", "X", "C", "V", "B", "N", "M"] as const;

interface RoomCodeKeypadProps {
  onKey: (char: string) => void;
  onBackspace: () => void;
  showNumbers?: boolean;
  disabled?: boolean;
}

/**
 * Native counterpart of `apps/web`'s `room-code-keyboard.tsx` — a custom
 * on-screen QWERTY keypad (not the OS keyboard), since the touch keypad is
 * the only input a phone needs here. The web version's physical-keyboard
 * `window.addEventListener("keydown", ...)` support is dropped entirely,
 * along with the `onEnter` prop that only that listener ever called — there
 * is no on-screen "enter" key in either version, and no hardware keyboard
 * listening concern on a touch device.
 *
 * `LetterKey`/`ActionKey` reuse `Button.tsx`'s "lip" shadow technique
 * (`shadowOffset`/`elevation` sunk on press) rather than the web's CSS
 * `box-shadow` classes, reading `surface`/`surface2`/`depthSurface`/
 * `depthSurface2` straight from `@word-lock/tokens/native` the same way
 * `Button.tsx` does.
 */
export function RoomCodeKeypad({
  onKey,
  onBackspace,
  showNumbers = true,
  disabled = false,
}: RoomCodeKeypadProps) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <View
      className="w-full gap-2.5"
      pointerEvents={disabled ? "none" : "auto"}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      {showNumbers && (
        <View className="flex-row gap-[5px]">
          {NUMBER_ROW.map((char) => (
            <LetterKey key={char} char={char} onPress={() => onKey(char)} />
          ))}
        </View>
      )}

      <View className="flex-row gap-[5px]">
        {ROW1.map((char) => (
          <LetterKey key={char} char={char} onPress={() => onKey(char)} />
        ))}
      </View>

      <View className="flex-row gap-[5px] px-[4%]">
        {ROW2.map((char) => (
          <LetterKey key={char} char={char} onPress={() => onKey(char)} />
        ))}
      </View>

      <View className="flex-row gap-[5px]">
        {ROW3.map((char) => (
          <LetterKey key={char} char={char} onPress={() => onKey(char)} />
        ))}
        <ActionKey onPress={onBackspace}>
          <BackspaceIcon size={20} color={palette.foreground} />
        </ActionKey>
      </View>
    </View>
  );
}

function LetterKey({ char, onPress }: { char: string; onPress: () => void }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={char}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="h-12 flex-1 items-center justify-center rounded-lg"
      style={{
        backgroundColor: palette.surface,
        transform: [{ translateY: pressed ? 2 : 0 }],
        shadowColor: palette.depthSurface,
        shadowOffset: { width: 0, height: pressed ? 1 : 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: pressed ? 1 : 3,
      }}
    >
      <Text className="text-lg font-bold text-foreground">{char}</Text>
    </Pressable>
  );
}

/**
 * Backspace key. Ports `ActionKey`'s press-and-hold-to-repeat behavior
 * (500ms initial delay, then a repeat every 50ms) onto `Pressable`'s
 * `onPressIn`/`onPressOut` — RN has no pointer-leave/cancel distinct from
 * press-out on a touch device, so `onPressOut` alone covers what the web
 * version needed three DOM listeners for.
 */
function ActionKey({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [pressed, setPressed] = useState(false);
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelHold = useCallback(() => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
      holdInterval.current = null;
    }
  }, []);

  const onPressIn = useCallback(() => {
    setPressed(true);
    onPress();
    holdTimeout.current = setTimeout(() => {
      holdInterval.current = setInterval(onPress, 50);
    }, 500);
  }, [onPress]);

  const onPressOut = useCallback(() => {
    setPressed(false);
    cancelHold();
  }, [cancelHold]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Backspace"
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className="h-12 flex-[1.5] items-center justify-center rounded-lg"
      style={{
        backgroundColor: palette.surface2,
        transform: [{ translateY: pressed ? 2 : 0 }],
        shadowColor: palette.depthSurface2,
        shadowOffset: { width: 0, height: pressed ? 1 : 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: pressed ? 1 : 3,
      }}
    >
      {children}
    </Pressable>
  );
}
