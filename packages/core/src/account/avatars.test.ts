import { afterEach, describe, expect, it } from "vitest";

import {
  AVATAR_COUNT,
  AVATAR_IDS,
  DEFAULT_AVATAR_ID,
  avatarIdFor,
  avatarUrl,
  isAvatarId,
  normalizeAvatarId,
} from "./avatars";

describe("avatarIdFor", () => {
  it("pads to two digits, matching the filenames and the CHECK in migration 009", () => {
    expect(avatarIdFor(1)).toBe("avatar_01");
    expect(avatarIdFor(9)).toBe("avatar_09");
    expect(avatarIdFor(10)).toBe("avatar_10");
    expect(avatarIdFor(51)).toBe("avatar_51");
  });
});

describe("AVATAR_IDS", () => {
  it("has one id per avatar in the bucket, in display order", () => {
    expect(AVATAR_IDS).toHaveLength(AVATAR_COUNT);
    expect(AVATAR_IDS[0]).toBe("avatar_01");
    expect(AVATAR_IDS[AVATAR_COUNT - 1]).toBe(avatarIdFor(AVATAR_COUNT));
  });

  it("defaults to the first avatar, mirroring the column default", () => {
    expect(DEFAULT_AVATAR_ID).toBe("avatar_01");
  });
});

describe("isAvatarId", () => {
  it("accepts ids this build knows about", () => {
    expect(isAvatarId("avatar_01")).toBe(true);
    expect(isAvatarId(avatarIdFor(AVATAR_COUNT))).toBe(true);
  });

  it("rejects the right-shaped-but-unknown, and anything that is not a string", () => {
    expect(isAvatarId(avatarIdFor(AVATAR_COUNT + 1))).toBe(false);
    expect(isAvatarId("avatar_1")).toBe(false);
    expect(isAvatarId("")).toBe(false);
    expect(isAvatarId(null)).toBe(false);
    expect(isAvatarId(undefined)).toBe(false);
    expect(isAvatarId(1)).toBe(false);
  });
});

describe("normalizeAvatarId", () => {
  it("passes through a known id", () => {
    expect(normalizeAvatarId("avatar_07")).toBe("avatar_07");
  });

  it("falls back rather than rendering a broken image", () => {
    expect(normalizeAvatarId(avatarIdFor(AVATAR_COUNT + 10))).toBe(DEFAULT_AVATAR_ID);
    expect(normalizeAvatarId(null)).toBe(DEFAULT_AVATAR_ID);
    expect(normalizeAvatarId(undefined)).toBe(DEFAULT_AVATAR_ID);
  });
});

describe("avatarUrl", () => {
  const BASE = "https://example.supabase.co";

  it("composes the public bucket path", () => {
    expect(avatarUrl("avatar_03", BASE)).toBe(
      `${BASE}/storage/v1/object/public/avatar/avatar_03.png`,
    );
  });

  it("normalizes before composing, so an unknown id still yields a loadable URL", () => {
    expect(avatarUrl("nonsense", BASE)).toBe(
      `${BASE}/storage/v1/object/public/avatar/${DEFAULT_AVATAR_ID}.png`,
    );
  });

  it("returns empty rather than throwing when no origin is configured", () => {
    expect(avatarUrl("avatar_03", undefined)).toBe("");
  });

  describe("environment fallback", () => {
    const original = {
      next: process.env.NEXT_PUBLIC_SUPABASE_URL,
      expo: process.env.EXPO_PUBLIC_SUPABASE_URL,
    };

    function restore(key: "NEXT_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_URL", value?: string) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    afterEach(() => {
      restore("NEXT_PUBLIC_SUPABASE_URL", original.next);
      restore("EXPO_PUBLIC_SUPABASE_URL", original.expo);
    });

    const composed = `${BASE}/storage/v1/object/public/avatar/avatar_02.png`;

    it("uses the Next variable when it is the one defined", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = BASE;
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      expect(avatarUrl("avatar_02")).toBe(composed);
    });

    it("falls back to the Expo variable on a device build", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.EXPO_PUBLIC_SUPABASE_URL = BASE;
      expect(avatarUrl("avatar_02")).toBe(composed);
    });

    it("returns empty when neither is defined", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      expect(avatarUrl("avatar_02")).toBe("");
    });
  });
});
