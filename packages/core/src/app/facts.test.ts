import { describe, expect, it } from "vitest";

import {
  CHANGELOG_URL,
  LICENSE_URL,
  PRIVACY_URL,
  REPO_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
  supportMailtoFor,
} from "./facts";

describe("link constants", () => {
  it("derives the changelog and licence from the repo URL", () => {
    expect(CHANGELOG_URL.startsWith(REPO_URL)).toBe(true);
    expect(LICENSE_URL.startsWith(REPO_URL)).toBe(true);
  });

  it("has both legal URLs set", () => {
    expect(PRIVACY_URL).toBe("/legal/privacy");
    expect(TERMS_URL).toBe("/legal/terms");
  });
});

describe("supportMailtoFor", () => {
  const mailto = supportMailtoFor({ version: "1.2.3", device: "Pixel 8 / Android 15" });

  it("addresses the support inbox", () => {
    expect(mailto.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
  });

  it("carries the version and device, which is the entire point", () => {
    const body = decodeURIComponent(new URL(mailto).searchParams.get("body") ?? "");
    expect(body).toContain("Version: 1.2.3");
    expect(body).toContain("Device: Pixel 8 / Android 15");
  });

  it("leaves blank lines above the details so the sender writes first", () => {
    const body = decodeURIComponent(new URL(mailto).searchParams.get("body") ?? "");
    expect(body.startsWith("\n\n---")).toBe(true);
  });

  it("percent-encodes spaces in the subject rather than using +", () => {
    const encoded = supportMailtoFor({ version: "1", device: "d", subject: "a b" });
    expect(encoded).toContain("subject=a%20b");
    expect(encoded).not.toContain("subject=a+b");
  });

  it("defaults the subject", () => {
    expect(mailto).toContain("subject=Word%20lock%20support");
  });
});
