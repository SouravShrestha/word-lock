import { describe, expect, it } from "vitest";
import { MAX_USERNAME_LENGTH, normalizeUsername, validateUsername } from "./names";

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    expect(normalizeUsername("  WordFox  ")).toBe("wordfox");
  });
});

describe("validateUsername", () => {
  it("accepts valid handles", () => {
    expect(validateUsername("wordfox")).toBeNull();
    expect(validateUsername("tilefox42")).toBeNull();
    expect(validateUsername("a1b")).toBeNull();
  });

  it("rejects handles that are too short or too long", () => {
    expect(validateUsername("ab")).toBe("too_short");
    expect(validateUsername("a".repeat(MAX_USERNAME_LENGTH + 1))).toBe("too_long");
  });

  it("rejects disallowed characters, including uppercase and spaces", () => {
    expect(validateUsername("word fox")).toBe("invalid_characters");
    expect(validateUsername("word-fox")).toBe("invalid_characters");
    expect(validateUsername("wordfox!")).toBe("invalid_characters");
    // Callers are expected to normalise first; an unnormalised value is invalid.
    expect(validateUsername("WordFox")).toBe("invalid_characters");
  });

  it("rejects lookalike scripts that would make leaderboard entries impersonable", () => {
    expect(validateUsername("wоrdfox")).toBe("invalid_characters"); // Cyrillic о
  });

  it("rejects a leading underscore", () => {
    expect(validateUsername("_wordfox")).toBe("leading_underscore");
  });

  it("rejects reserved handles", () => {
    expect(validateUsername("admin")).toBe("reserved");
    expect(validateUsername("wordlock")).toBe("reserved");
    expect(validateUsername("leaderboard")).toBe("reserved");
  });
});
