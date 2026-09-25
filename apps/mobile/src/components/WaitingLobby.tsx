import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { CheckIcon, CopyIcon, InviteIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTheme } from "@/theme/ThemeProvider";

export function WaitingLobby({
  roomCode,
  game,
  isSpectator,
  joinError,
  onDestroy,
  onStart,
  shareUrl,
  onLeave,
}: {
  roomCode: string;
  game: WaitingGame;
  isSpectator: boolean;
  joinError: string | null;
  onDestroy: () => void;
  onStart: () => Promise<unknown>;
  shareUrl: string;
  onLeave: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const opponentJoined = !!game.players.two;
  const isHost = game.viewerSlot === 1;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Join my Word-lock game!",
        message: shareUrl,
        url: shareUrl,
      });
    } catch {
      await Clipboard.setStringAsync(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      await onStart();
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Failed to start. Try again.");
      setStarting(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-5 pt-16">
      <View className="ml-3">
        <BackButton onPress={() => setShowConfirm(true)} label="Exit lobby" />
      </View>

      <View className="flex-1 items-center justify-center gap-10 px-5 py-10">
        {isHost ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy room code"
            onPress={handleCopy}
            className="flex-row items-center gap-3 rounded-lg py-3 pl-7 pr-5"
            style={{ backgroundColor: palette.surface }}
          >
            <Text className="font-display text-xl font-bold tracking-[0.3em] text-foreground">
              {roomCode}
            </Text>
            {copied ? (
              <CheckIcon size={16} color={palette.mutedForeground} />
            ) : (
              <CopyIcon size={16} color={palette.mutedForeground} />
            )}
          </Pressable>
        ) : (
          <View className="py-3">
            <Text className="font-display text-xl font-bold tracking-[0.3em] text-foreground">
              #{roomCode}
            </Text>
          </View>
        )}

        <View className="my-3 w-full max-w-xs flex-row items-start justify-between px-4">
          <PlayerSlot name={game.players.one?.name ?? "You"}>
            <Avatar avatar={game.players.one?.avatar} size={64} />
          </PlayerSlot>

          <Text className="pt-7 text-sm font-bold text-mutedForeground">vs</Text>

          {opponentJoined ? (
            <PlayerSlot name={game.players.two!.name}>
              <Avatar avatar={game.players.two?.avatar} size={64} />
            </PlayerSlot>
          ) : isHost ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share join link"
              onPress={handleShare}
              className="items-center gap-2.5"
            >
              <View
                className="h-[72px] w-[72px] items-center justify-center rounded-full border-2"
                style={{ borderColor: palette.hairline }}
              >
                <InviteIcon size={20} color={palette.foreground} />
              </View>
              <Text
                className="max-w-20 text-center text-xs font-bold text-foreground"
                numberOfLines={1}
              >
                Share link
              </Text>
            </Pressable>
          ) : (
            <View className="items-center gap-2.5">
              <View
                className="h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${palette.surface}66` }}
              >
                <View
                  className="h-11 w-11 rounded-full border-2 border-dashed"
                  style={{ borderColor: `${palette.mutedForeground}4d` }}
                />
              </View>
              <Text className="font-sans text-xs text-transparent">·</Text>
            </View>
          )}
        </View>

        <View className="w-full max-w-xs items-center gap-2">
          {isSpectator ? (
            <Text className="py-4 text-center text-sm font-semibold text-mutedForeground">
              {joinError ? (
                <Text style={{ color: palette.destructive }}>{joinError}</Text>
              ) : (
                "Joining game"
              )}
            </Text>
          ) : isHost ? (
            <>
              <Button
                variant="blush"
                className="w-[65%]"
                disabled={!opponentJoined || starting}
                loading={starting}
                onPress={handleStart}
              >
                {starting ? "Game is starting" : "Start Game"}
              </Button>
              {!opponentJoined && (
                <Text className="mt-4 text-xs font-bold text-mutedForeground">
                  Waiting for opponent
                </Text>
              )}
              {startError && (
                <Text className="font-sans text-xs" style={{ color: palette.destructive }}>
                  {startError}
                </Text>
              )}
            </>
          ) : (
            <Text className="mt-4 py-4 text-center text-sm font-semibold text-mutedForeground">
              {opponentJoined ? "Waiting for host to start" : "Waiting for opponent"}
            </Text>
          )}
        </View>
      </View>

      <ConfirmDialog
        open={showConfirm}
        title="Exit lobby?"
        description={isHost ? "The lobby will be disbanded." : "You'll leave the game lobby."}
        confirmLabel="Exit"
        onConfirm={() => {
          setShowConfirm(false);
          (isHost ? onDestroy : onLeave)();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </View>
  );
}

export interface WaitingGame {
  id: string;
  status: string;
  viewerSlot: 1 | 2 | null;
  players: {
    one: { id: string; name: string; avatar?: string | null } | null;
    two: { id: string; name: string; avatar?: string | null } | null;
  };
}

function PlayerSlot({ name, children }: { name: string; children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <View className="items-center gap-2.5">
      <View
        className="h-[72px] w-[72px] items-center justify-center rounded-full border-2"
        style={{ borderColor: palette.hairline }}
      >
        {children}
      </View>
      <Text className="max-w-20 text-center text-xs font-bold text-foreground" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}
