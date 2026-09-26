import { useCallback, useRef } from "react";

export function useDebouncePress(onPress?: () => void, delay = 300) {
  const blocked = useRef(false);

  return useCallback(() => {
    if (!onPress || blocked.current) return;
    blocked.current = true;
    onPress();
    setTimeout(() => {
      blocked.current = false;
    }, delay);
  }, [onPress, delay]);
}
