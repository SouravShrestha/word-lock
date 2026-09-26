import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  TouchableOpacity as BottomSheetTouchableOpacity,
  useBottomSheet,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { useAnimatedReaction, runOnJS, Easing } from "react-native-reanimated";
import { cssInterop } from "nativewind";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@word-lock/tokens/native";

import { useSheetStack } from "@/components/sheet-stack";
import { useTheme } from "@/theme/ThemeProvider";

const STUCK_DISMISS_MS = 1200;

export function BottomSheet({
  open,
  onClose,
  label,
  dismissable = true,
  showHandle = true,
  scrollable = true,
  maxHeight,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  label: string;
  dismissable?: boolean;
  showHandle?: boolean;
  scrollable?: boolean;
  maxHeight?: number;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  useSheetStack(open, dismissable, onClose);

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 150,
    easing: Easing.out(Easing.cubic),
  });

  const sheetRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const presented = useRef(false);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const settled = useRef(0);
  const [instance, setInstance] = useState(0);
  const wanted = useRef(0);

  useEffect(() => {
    if (!open) return;
    wanted.current += 1;
    setInstance(wanted.current);
  }, [open]);

  useEffect(() => {
    if (open) {
      if (instance !== wanted.current) return;
      presented.current = true;
      sheetRef.current?.present();
      return;
    }

    if (!presented.current) return;
    presented.current = false;
    sheetRef.current?.dismiss();

    const deadline = setTimeout(() => {
      if (settled.current === instance) return;
      wanted.current += 1;
      setInstance(wanted.current);
    }, STUCK_DISMISS_MS);
    return () => clearTimeout(deadline);
  }, [open, instance]);

  const handleDismissed = useCallback(() => {
    settled.current = instance;
    if (instance !== wanted.current) return;
    if (!openRef.current || !dismissable) return;
    onClose?.();
  }, [dismissable, onClose, instance]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={dismissable ? "close" : "none"}
      />
    ),
    [dismissable],
  );

  const handleIndicatorStyle = useMemo(
    () => ({
      backgroundColor: palette.mutedForeground,
      opacity: showHandle ? 0.3 : 0,
      width: showHandle ? 40 : 0,
    }),
    [showHandle, palette.mutedForeground],
  );

  return (
    <BottomSheetModal
      key={instance}
      ref={sheetRef}
      stackBehavior="push"
      enableDynamicSizing
      maxDynamicContentSize={maxHeight}
      enablePanDownToClose={dismissable}
      enableContentPanningGesture={dismissable}
      enableHandlePanningGesture={dismissable}
      onDismiss={handleDismissed}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: palette.background }}
      style={{
        borderTopLeftRadius: radius["2xl"],
        borderTopRightRadius: radius["2xl"],
        overflow: "hidden",
      }}
      handleIndicatorStyle={handleIndicatorStyle}
      animationConfigs={animationConfigs}
    >
      <CloseWatcher onClosed={handleDismissed} />
      {scrollable ? (
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          accessibilityViewIsModal
          accessibilityRole="none"
          accessibilityLabel={label}
        >
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: showHandle ? 4 : 20,
              paddingBottom: Math.max(insets.bottom, 40),
            }}
          >
            {children}
          </View>
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView
          accessibilityViewIsModal
          accessibilityRole="none"
          accessibilityLabel={label}
        >
          <View
            style={{
              paddingHorizontal: 26,
              paddingTop: showHandle ? 4 : 20,
              paddingBottom: Math.max(insets.bottom, 40),
            }}
          >
            {children}
          </View>
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

export function CloseWatcher({ onClosed }: { onClosed: () => void }) {
  const { animatedIndex } = useBottomSheet();

  useAnimatedReaction(
    () => animatedIndex.value,
    (index, previous) => {
      if (previous !== null && previous > -0.9 && index <= -0.99) {
        runOnJS(onClosed)();
      }
    },
    [onClosed],
  );

  return null;
}

export const SheetTextInput = BottomSheetTextInput;
export const SheetTouchable = BottomSheetTouchableOpacity;

cssInterop(SheetTouchable, { className: "style" });
cssInterop(SheetTextInput, { className: "style" });
