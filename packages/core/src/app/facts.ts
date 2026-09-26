export const SUPPORT_EMAIL = "souravshrestha@cbsdev.me";

export const AUTHOR_NAME = "Sourav Shrestha";
export const AUTHOR_URL = "https://www.cbsdev.me/";

export const REPO_URL = "https://github.com/SouravShrestha/word-lock";
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

export const WORDLIST_URL = "https://github.com/dwyl/english-words";

export const PRIVACY_URL: string | null = "/legal/privacy";
export const TERMS_URL: string | null = "/legal/terms";

export const PRIVACY_UPDATED = "22 September 2026";

export function supportMailtoFor(options: {
  version: string;
  device: string;
  subject?: string;
}): string {
  const { version, device, subject = "Word lock support" } = options;
  const lines = ["", "", "---", `Version: ${version}`, `Device: ${device}`];
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  return `mailto:${SUPPORT_EMAIL}?${query}`;
}

export function joinUrl(origin: string, roomCode: string): string {
  return `${origin.replace(/\/+$/, "")}/game/${roomCode}`;
}
