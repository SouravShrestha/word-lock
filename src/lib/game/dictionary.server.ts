// Server-only dictionary access. Never import from client code.
import { WORD_LIST_RAW } from "./wordlist.server";

let cached: Set<string> | undefined;

export function getDictionary(): Set<string> {
  if (!cached) {
    cached = new Set(WORD_LIST_RAW.split(" ").map((w) => w.toUpperCase()));
  }
  return cached;
}

export function isWord(word: string): boolean {
  return getDictionary().has(word.toUpperCase());
}
