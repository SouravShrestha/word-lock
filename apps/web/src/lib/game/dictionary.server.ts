import { gunzipSync } from "node:zlib";
import { WORD_LIST_GZIP_BASE64 } from "./wordlist.server";

let cached: Set<string> | undefined;

function decodeWordList(): Set<string> {
  const compressed = Buffer.from(WORD_LIST_GZIP_BASE64, "base64");
  const frontCoded = gunzipSync(compressed).toString("utf8");

  const words = new Set<string>();
  let prev = "";
  /*
   * Each entry is exactly one marker character — the length of the shared
   * prefix with the previous word, as a character code starting at 48 — and
   * that entry's differing suffix (lowercase letters only), repeated back to
   * back with no separator. Matching `[^a-z][a-z]*` therefore splits the
   * whole blob back into (marker, suffix) pairs in original order.
   */
  for (const match of frontCoded.matchAll(/[^a-z][a-z]*/g)) {
    const token = match[0];
    const shared = token.charCodeAt(0) - 48;
    const word = prev.slice(0, shared) + token.slice(1);
    words.add(word.toUpperCase());
    prev = word;
  }
  return words;
}

export function getDictionary(): Set<string> {
  if (!cached) {
    cached = decodeWordList();
  }
  return cached;
}

export function isWord(word: string): boolean {
  return getDictionary().has(word.toUpperCase());
}
