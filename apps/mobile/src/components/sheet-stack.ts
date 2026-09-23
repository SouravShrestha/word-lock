import { useEffect, useState } from "react";
import { BackHandler } from "react-native";

let stack: symbol[] = [];

function open(id: symbol) {
  stack = [...stack.filter((entry) => entry !== id), id];
}

function close(id: symbol) {
  stack = stack.filter((entry) => entry !== id);
}

function isTop(id: symbol): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}

export function useSheetStack(isOpen: boolean, dismissable: boolean, onClose?: () => void) {
  const [id] = useState(() => Symbol("bottom-sheet"));

  useEffect(() => {
    if (isOpen) {
      open(id);
    } else {
      close(id);
    }
    return () => close(id);
  }, [isOpen, id]);

  useEffect(() => {
    if (!isOpen || !dismissable) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isTop(id)) return false;
      onClose?.();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen, dismissable, onClose, id]);
}
