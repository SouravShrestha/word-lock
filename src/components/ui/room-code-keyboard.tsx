"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { Delete } from "@/components/icons";
import { useSound } from "@/hooks/use-sound";
import { cn } from "@/lib/utils";

const NUMBER_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;
const ROW1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"] as const;
const ROW2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"] as const;
const ROW3 = ["Z", "X", "C", "V", "B", "N", "M"] as const;

const PHYSICAL_KEY_WHITELIST = new Set<string>([...NUMBER_ROW, ...ROW1, ...ROW2, ...ROW3]);

interface RoomCodeKeyboardProps {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  showNumbers?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RoomCodeKeyboard({
  onKey,
  onBackspace,
  onEnter,
  showNumbers = true,
  disabled = false,
  className,
}: RoomCodeKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const { play } = useSound();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toUpperCase();

      const mappedKey = key === "DELETE" ? "BACKSPACE" : key;
      if (
        mappedKey === "BACKSPACE" ||
        mappedKey === "ENTER" ||
        PHYSICAL_KEY_WHITELIST.has(mappedKey)
      ) {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.add(mappedKey);
          return next;
        });

        // Auto clear after 150ms for visual ripple
        setTimeout(() => {
          setActiveKeys((prev) => {
            const next = new Set(prev);
            next.delete(mappedKey);
            return next;
          });
        }, 150);
      }

      if (key === "BACKSPACE" || key === "DELETE") {
        e.preventDefault();
        play("key");
        onBackspace();
      } else if (key === "ENTER") {
        e.preventDefault();
        play("key");
        onEnter();
      } else if (PHYSICAL_KEY_WHITELIST.has(key)) {
        e.preventDefault();
        play("key");
        onKey(key);
      }
    },
    [onKey, onBackspace, onEnter, disabled, play],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="w-full flex flex-col gap-2.5 pb-[max(18px,env(safe-area-inset-bottom))]">
        {showNumbers && (
          <div className="flex gap-[5px]">
            {NUMBER_ROW.map((char) => (
              <LetterKey
                key={char}
                char={char}
                onPress={() => onKey(char)}
                isActive={activeKeys.has(char)}
              />
            ))}
          </div>
        )}

        {/* QWERTY row */}
        <div className="flex gap-[5px]">
          {ROW1.map((char) => (
            <LetterKey
              key={char}
              char={char}
              onPress={() => onKey(char)}
              isActive={activeKeys.has(char)}
            />
          ))}
        </div>

        {/* Middle row - inset to mimic real keyboard stagger */}
        <div className="flex gap-[5px] px-[4%]">
          {ROW2.map((char) => (
            <LetterKey
              key={char}
              char={char}
              onPress={() => onKey(char)}
              isActive={activeKeys.has(char)}
            />
          ))}
        </div>

        {/* Bottom row: letters + backspace */}
        <div className="flex gap-[5px]">
          {ROW3.map((char) => (
            <LetterKey
              key={char}
              char={char}
              onPress={() => onKey(char)}
              isActive={activeKeys.has(char)}
            />
          ))}
          <ActionKey onPress={onBackspace} isActive={activeKeys.has("BACKSPACE")}>
            <Delete size={20} strokeWidth={2.5} />
          </ActionKey>
        </div>
      </div>

      {/* Disabled overlay */}
      {disabled && <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10" />}
    </div>
  );
}

function LetterKey({
  char,
  onPress,
  isActive,
}: {
  char: string;
  onPress: () => void;
  isActive?: boolean;
}) {
  const { play } = useSound();
  return (
    <button
      type="button"
      data-sound="none"
      onPointerDown={(e) => {
        e.preventDefault();
        play("key");
        onPress();
      }}
      className={cn(
        `
        flex-1 h-12 flex items-center justify-center
        rounded-lg select-none touch-manipulation
        bg-card border-2 border-ink
        text-foreground font-bold text-lg
        transition-all duration-75
      `,
        isActive ? "translate-y-[2px] bg-muted/80" : "active:translate-y-[2px] active:bg-muted/80",
      )}
    >
      {char}
    </button>
  );
}

function ActionKey({
  onPress,
  isActive,
  children,
}: {
  onPress: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { play } = useSound();

  const cancelHold = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
      holdInterval.current = null;
    }
  };

  return (
    <button
      type="button"
      data-sound="none"
      onPointerDown={(e) => {
        e.preventDefault();
        play("key");
        onPress();
        // After 500ms initial delay, repeat every 50ms
        holdTimeout.current = setTimeout(() => {
          holdInterval.current = setInterval(() => {
            play("key");
            onPress();
          }, 50);
        }, 500);
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      className={cn(
        `
        flex-[1.5] h-12 flex items-center justify-center
        rounded-lg select-none touch-manipulation
        bg-muted border-2 border-ink
        text-foreground
        transition-all duration-75
      `,
        isActive ? "translate-y-[2px] bg-muted/80" : "active:translate-y-[2px] active:bg-muted/80",
      )}
    >
      {children}
    </button>
  );
}
