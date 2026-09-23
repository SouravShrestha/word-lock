import { setAvatarFn, useSession } from "@word-lock/client";
import { AVATAR_IDS, normalizeAvatarId } from "@word-lock/core/account";
import { CheckIcon, CrossIcon } from "@word-lock/icons/native";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetView,
  TouchableOpacity as BottomSheetTouchableOpacity,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { cssInterop } from "nativewind";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { CloseWatcher } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { useSheetStack } from "@/components/sheet-stack";
import { useTheme } from "@/theme/ThemeProvider";

const NUM_COLUMNS = 4;
const HORIZONTAL_PADDING = 36;
const CELL_GAP = 16;

const SheetTouchable = cssInterop(BottomSheetTouchableOpacity, { className: "style" });

export function AvatarSheet({
  open,
  onClose,
  current,
}: {
  open: boolean;
  onClose: () => void;
  current: string | null | undefined;
}) {
  const { sessionId } = useSession();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const insets = useSafeAreaInsets();
  const stored = normalizeAvatarId(current);
  const [selected, setSelected] = useState(stored);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useSheetStack(open, true, onClose);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the draft selection on each open, a prop transition rather than derivable state (same pattern as UsernameSheet.tsx/AuthSheet.tsx)
    if (open) setSelected(stored);
  }, [open, stored]);

  const mutation = useMutation({
    mutationFn: () => setAvatarFn({ sessionId: sessionId!, avatar: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onClose();
    },
  });

  const unchanged = selected === stored;

  const cellSize =
    (screenWidth - HORIZONTAL_PADDING * 2 - CELL_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  // ── sheet lifecycle (mirrors BottomSheet.tsx) ───────────────────────────────
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
    }, 1200);
    return () => clearTimeout(deadline);
  }, [open, instance]);

  const handleDismissed = useCallback(() => {
    settled.current = instance;
    if (instance !== wanted.current) return;
    if (!openRef.current) return;
    onClose();
  }, [onClose, instance]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: palette.mutedForeground, opacity: 0.3, width: 40 }),
    [palette.mutedForeground],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View
          style={{
            paddingHorizontal: HORIZONTAL_PADDING,
            paddingTop: 20,
            paddingBottom: Math.max(insets.bottom, 24),
            backgroundColor: palette.background,
            marginHorizontal: -12,
          }}
        >
          <Button
            variant="sky"
            disabled={unchanged || mutation.isPending || !sessionId}
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          >
            {unchanged ? "Saved" : "Save avatar"}
          </Button>
          {mutation.error && (
            <Text className="mt-2 text-center text-sm font-semibold text-destructive">
              {mutation.error.message}
            </Text>
          )}
        </View>
      </BottomSheetFooter>
    ),
    [unchanged, mutation, sessionId, insets.bottom, palette.background],
  );

  const footerHeight = 56 + 12 + Math.max(insets.bottom, 24);

  return (
    <BottomSheetModal
      key={instance}
      ref={sheetRef}
      stackBehavior="push"
      enableDynamicSizing
      maxDynamicContentSize={screenHeight * 0.8}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={{ backgroundColor: palette.background }}
      style={{
        borderTopLeftRadius: radius["2xl"],
        borderTopRightRadius: radius["2xl"],
        overflow: "hidden",
      }}
      handleIndicatorStyle={handleIndicatorStyle}
      animationConfigs={animationConfigs}
      onDismiss={handleDismissed}
    >
      <CloseWatcher onClosed={handleDismissed} />

      <BottomSheetView
        accessibilityViewIsModal
        accessibilityRole="none"
        accessibilityLabel="Choose your avatar"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: palette.background,
          paddingTop: 24,
          marginHorizontal: -12,
        }}
      >
        <View
          style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 4, paddingBottom: 28 }}
          className="flex-row items-start justify-between gap-4"
        >
          <View className="flex-1 gap-1">
            <Text className="font-display text-xl text-foreground">Choose your avatar</Text>
            <Text className="font-sans text-[15px] leading-relaxed text-mutedForeground">
              This is the face players see next to your name
            </Text>
          </View>
          <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
            <CrossIcon size={14} color="#ffffff" />
          </IconButton>
        </View>
      </BottomSheetView>

      {/* Scrollable avatar grid */}
      <BottomSheetFlatList
        data={AVATAR_IDS}
        keyExtractor={(id) => id}
        numColumns={NUM_COLUMNS}
        accessibilityRole="none"
        showsVerticalScrollIndicator={false}
        style={{ marginBottom: footerHeight }}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingBottom: 24,
          gap: CELL_GAP,
          marginTop: 142,
        }}
        columnWrapperStyle={{ gap: CELL_GAP }}
        renderItem={({ item: id, index }) => {
          const active = id === selected;
          return (
            <SheetTouchable
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Avatar ${index + 1}`}
              onPress={() => setSelected(id)}
              disabled={mutation.isPending}
              activeOpacity={0.6}
              style={{
                width: cellSize,
                height: cellSize,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: cellSize / 2,
                borderWidth: active ? 2.5 : 0,
                borderColor: palette.sky,
                padding: active ? 2 : 0,
              }}
            >
              <View style={{ position: "relative" }}>
                <Avatar avatar={id} size={active ? cellSize - 9 : cellSize - 4} />
                {active && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: palette.sky,
                    }}
                  >
                    <CheckIcon size={18} color={palette.background} />
                  </View>
                )}
              </View>
            </SheetTouchable>
          );
        }}
      />
    </BottomSheetModal>
  );
}
