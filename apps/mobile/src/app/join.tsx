import { Text } from "@/components/text";
import { useSession, joinGameFn } from "@word-lock/client";
import { roomCodeAfterPaste } from "@word-lock/core/game";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@word-lock/tokens/native";

import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { RoomCodeKeypad } from "@/components/RoomCodeKeypad";
import { useTheme } from "@/theme/ThemeProvider";

const CODE_LENGTH = 5;

export default function JoinScreen() {
  const { sessionId, ready } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const insets = useSafeAreaInsets();
  const [joinCode, setJoinCode] = useState("");

  const joinMutation = useMutation({
    mutationFn: () =>
      joinGameFn({
        sessionId: sessionId!,
        roomCode: joinCode.trim().toUpperCase(),
      }),
    onSuccess: ({ roomCode }) => router.push(`/game/${roomCode}`),
  });

  const handleKey = (char: string) => {
    if (joinCode.length < CODE_LENGTH) {
      setJoinCode((joinCode + char).toUpperCase());
      if (joinMutation.error) joinMutation.reset();
    }
  };

  const handleBackspace = () => {
    setJoinCode(joinCode.slice(0, -1));
    if (joinMutation.error) joinMutation.reset();
  };

  // Only a paste reaches the overlay TextInput (its soft keyboard is off), so treat any change as one.
  const handleChangeText = (text: string) => {
    setJoinCode(
      text.startsWith(joinCode)
        ? roomCodeAfterPaste(joinCode, text.slice(joinCode.length))
        : roomCodeAfterPaste("", text),
    );
    if (joinMutation.error) joinMutation.reset();
  };

  const handleSubmit = () => {
    if (joinCode.length === CODE_LENGTH) {
      joinMutation.mutate();
    }
  };

  return (
    <View className="flex-1 bg-background px-5 pt-16">
      <View className="ml-3">
        <BackButton />
      </View>

      <View className="mx-auto flex-1 w-full max-w-sm px-0">
        <View className="mx-auto mb-8 mt-20 w-full max-w-[300px] flex-row gap-2.5">
          {/* Invisible input over the boxes so a long-press offers the system Paste menu. */}
          <TextInput
            value={joinCode}
            onChangeText={handleChangeText}
            showSoftInputOnFocus={false}
            caretHidden
            autoCorrect={false}
            autoCapitalize="characters"
            accessibilityLabel="Room code"
            style={[StyleSheet.absoluteFill, { zIndex: 1, color: "transparent" }]}
          />
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const char = joinCode[i];
            const isCursor = i === joinCode.length;
            return (
              <View
                key={i}
                className="h-12 flex-1 items-center justify-center rounded-md"
                style={{
                  backgroundColor: palette.surface,
                  borderWidth: isCursor ? 2 : 2,
                  borderColor: isCursor ? palette.sky : palette.border,
                }}
              >
                <Text variant="sheetTitle">{char ?? ""}</Text>
              </View>
            );
          })}
        </View>

        <Button
          variant="sky"
          className="mx-auto w-full max-w-[240px]"
          disabled={!ready || joinMutation.isPending || joinCode.length < CODE_LENGTH}
          loading={joinMutation.isPending}
          onPress={handleSubmit}
        >
          {joinMutation.isPending ? "Joining" : "Let's go!"}
        </Button>

        {joinMutation.error && (
          <Text variant="error" className="mt-4">
            {joinMutation.error.message}
          </Text>
        )}

        <View className="mt-auto" style={{ paddingBottom: Math.max(insets.bottom, 18) }}>
          <RoomCodeKeypad onKey={handleKey} onBackspace={handleBackspace} showNumbers />
        </View>
      </View>
    </View>
  );
}
