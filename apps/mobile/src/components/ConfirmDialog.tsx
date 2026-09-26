import { Text } from "@/components/text";
import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { Button } from "@/components/Button";
import { useSheetStack } from "@/components/sheet-stack";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isPending = false,
  pendingLabel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  pendingLabel?: string;
}) {
  const dismissable = !isPending;
  useSheetStack(open, dismissable, onCancel);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={isPending ? undefined : onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <Pressable
          onPress={isPending ? undefined : onCancel}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
        />
        <View
          accessibilityRole="none"
          accessibilityLabel={title}
          className="w-full max-w-xs gap-4 rounded-2xl border border-surfaceHairline bg-surface p-6"
        >
          <View className="items-center gap-1">
            <Text variant="autoGen7">{title}</Text>
            {description && (
              <Text variant="body" className="mt-1">
                {description}
              </Text>
            )}
          </View>
          <View className="flex-row gap-3">
            <Button variant="surface2" className="flex-1" disabled={isPending} onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={isPending}
              loading={isPending}
              onPress={onConfirm}
            >
              {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
