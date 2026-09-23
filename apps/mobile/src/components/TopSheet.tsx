import { colors, radius } from "@word-lock/tokens/native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

const OPEN_MS = 260;
const CLOSE_MS = 200;
const OFFSCREEN_FALLBACK = 900;

export function TopSheet({
  open,
  onClose,
  label,
  dismissable = true,
  showHandle = true,
  scrollable = true,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  label: string;
  dismissable?: boolean;
  showHandle?: boolean;
  scrollable?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const [progress] = useState(() => new Animated.Value(0));
  const [visible, setVisible] = useState(open);
  const [panelHeight, setPanelHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the Modal has to be mounted before the entry animation can be seen; this is a prop transition, not derivable at render time
      setVisible(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [open, progress]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const translateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-(panelHeight || OFFSCREEN_FALLBACK), 0],
      }),
    [progress, panelHeight],
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={dismissable ? onClose : () => {}}
      statusBarTranslucent
    >
      <View className="flex-1">
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            opacity: progress,
          }}
        >
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={dismissable ? onClose : undefined}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="none"
          accessibilityLabel={label}
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}
          style={{
            backgroundColor: palette.background,
            borderBottomLeftRadius: radius["2xl"],
            borderBottomRightRadius: radius["2xl"],
            overflow: "hidden",
            maxHeight: Math.max(windowHeight - keyboardHeight - 24, 0),
            transform: [{ translateY }],
          }}
        >
          <ScrollView
            scrollEnabled={scrollable || keyboardHeight > 0}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: 26,
              paddingTop: Math.max(insets.top, 20) + 24,
              paddingBottom: showHandle ? 8 : 28,
            }}
          >
            {children}
          </ScrollView>

          {showHandle && (
            <View className="items-center pb-3">
              <View
                style={{
                  height: 4,
                  width: 40,
                  borderRadius: 2,
                  backgroundColor: palette.mutedForeground,
                  opacity: 0.3,
                }}
              />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

export const SheetTextInput = TextInput;
