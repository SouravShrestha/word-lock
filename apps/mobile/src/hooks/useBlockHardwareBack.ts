import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * Swallows every Android hardware-back press that no higher-priority
 * listener (e.g. a dismissable bottom sheet) has already handled.
 *
 * Registered once at the root — sheet-stack handlers are added later
 * so BackHandler calls them first; if none claims the event this
 * catch-all returns true to prevent the default pop/exit.
 */
export function useBlockHardwareBack() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);
}
