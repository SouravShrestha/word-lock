import { describe, expect, it } from "vitest";
import { getDictionary, isWord } from "./dictionary.server";

// The generated word list is front-coded, gzipped and base64-encoded (see
// scripts/generate-wordlist.mjs) so the ~3MB source list ships as well under
// a megabyte. These are the round-trip checks that a mistake in either the
// encoder or `decodeWordList` would actually fail — a corrupt or
// off-by-one decode still produces *a* Set, just the wrong one.
describe("dictionary", () => {
  it("decodes to the expected word count", () => {
    // Pinned to the count `generate-wordlist.mjs` reports for the checked-in
    // data/words_alpha.txt. A change here should come from regenerating the
    // wordlist, not from a decode bug.
    expect(getDictionary().size).toBe(314_673);
  });

  it("recognises real words case-insensitively", () => {
    expect(isWord("cat")).toBe(true);
    expect(isWord("CAT")).toBe(true);
    expect(isWord("zebra")).toBe(true);
  });

  it("includes the first and last entries of the sorted source list", () => {
    // These sit at the very start and end of the front-coded blob, so a
    // truncated decode or an off-by-one in the shared-prefix marker would be
    // most likely to lose exactly these.
    expect(isWord("aaa")).toBe(true);
    expect(isWord("zyzzyvas")).toBe(true);
  });

  it("rejects non-words and out-of-range lengths", () => {
    expect(isWord("zzzznotaword")).toBe(false);
    expect(isWord("ab")).toBe(false); // below MIN_LEN
  });

  it("caches the decoded set across calls", () => {
    expect(getDictionary()).toBe(getDictionary());
  });
});
