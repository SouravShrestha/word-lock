export {
  AUTHOR_NAME,
  AUTHOR_URL,
  CHANGELOG_URL,
  joinUrl,
  LICENSE_URL,
  PRIVACY_UPDATED,
  PRIVACY_URL,
  REPO_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
  WORDLIST_URL,
} from "@word-lock/core/app";

import Constants from "expo-constants";
import { Platform } from "react-native";
import { supportMailtoFor } from "@word-lock/core/app";

export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";

export function siteUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!configured) {
    throw new Error("Missing environment variable: EXPO_PUBLIC_API_URL");
  }
  return configured;
}

export function supportMailto(subject = "Word lock support"): string {
  const device = Constants.deviceName ?? `${Platform.OS} ${Platform.Version}`;
  return supportMailtoFor({ version: APP_VERSION, device, subject });
}
