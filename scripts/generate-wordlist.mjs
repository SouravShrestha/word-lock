#!/usr/bin/env node
// Regenerates src/lib/game/wordlist.server.ts from a newline-delimited
// source word list (data/words_alpha.txt, from dwyl/english-words).
//
// Filter: strict lowercase-alpha-only, length 3-12.
// Usage: node scripts/generate-wordlist.mjs [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SOURCE_PATH = path.join(ROOT, "data", "words_alpha.txt");
const OUTPUT_PATH = path.join(ROOT, "src", "lib", "game", "wordlist.server.ts");

export const MIN_LEN = 3;
export const MAX_LEN = 12;
const STRICT_WORD = /^[a-z]{3,12}$/;

export function isValidWord(raw) {
  return STRICT_WORD.test(raw);
}

/**
 * Front-codes a sorted word list: each entry becomes one marker character —
 * the length of the prefix it shares with the *previous* word, encoded as
 * `String.fromCharCode(48 + sharedLength)` — followed by just the letters
 * that differ. Adjacent entries in a sorted dictionary share long prefixes
 * far more than gzip's own back-reference window exploits unaided ("aahed"
 * right after "aah" only costs 3 bytes here: the marker plus "ed"), so this
 * buys real savings *in addition to* gzip, not instead of it.
 *
 * A single marker character is always enough: words are capped at
 * {@link MAX_LEN} (12) letters, and two *distinct* words of at most 12
 * letters can never share all 12 — that would make them identical — so the
 * shared-prefix length is at most 11, safely inside one character's range
 * and, since it starts at code point 48, never collides with a lowercase
 * suffix letter (97-122). See `decodeWordList` in `dictionary.server.ts` for
 * the matching decoder.
 */
export function frontCode(sortedWords) {
  let prev = "";
  const parts = [];
  for (const word of sortedWords) {
    let shared = 0;
    const max = Math.min(prev.length, word.length);
    while (shared < max && prev[shared] === word[shared]) shared++;
    parts.push(String.fromCharCode(48 + shared) + word.slice(shared));
    prev = word;
  }
  return parts.join("");
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  const raw = readFileSync(SOURCE_PATH, "utf8");
  const lines = raw.split(/\r?\n/);

  const kept = new Set();
  const histogram = new Map();
  let droppedCount = 0;

  for (const line of lines) {
    const word = line.trim().toLowerCase();
    if (!word) continue;
    if (isValidWord(word)) {
      kept.add(word);
      histogram.set(word.length, (histogram.get(word.length) ?? 0) + 1);
    } else {
      droppedCount++;
    }
  }

  const sorted = Array.from(kept).sort();
  const frontCoded = frontCode(sorted);
  const gzipBase64 = gzipSync(frontCoded).toString("base64");

  const header =
    `// Auto-generated word list (dwyl/english-words words_alpha.txt, filtered to ${MIN_LEN}-${MAX_LEN} lowercase letters).\n` +
    `// Source: https://github.com/dwyl/english-words (words_alpha.txt)\n` +
    `// Regenerate with: node scripts/generate-wordlist.mjs\n` +
    `//\n` +
    `// Front-coded (see frontCode in scripts/generate-wordlist.mjs), then gzipped\n` +
    `// and base64-encoded. Decoded lazily by decodeWordList in dictionary.server.ts —\n` +
    `// this constant is never meant to be read directly.\n`;
  const output = `${header}export const WORD_LIST_GZIP_BASE64 = "${gzipBase64}";\n`;

  const plainBytes = Buffer.byteLength(sorted.join(" "), "utf8");
  const outputBytes = Buffer.byteLength(output, "utf8");

  console.log("Source lines:      ", lines.length.toLocaleString());
  console.log("Kept words:         ", sorted.length.toLocaleString());
  console.log("Dropped lines:      ", droppedCount.toLocaleString());
  console.log("Length histogram:");
  for (const len of Array.from(histogram.keys()).sort((a, b) => a - b)) {
    console.log(`  ${String(len).padStart(2, " ")}: ${histogram.get(len).toLocaleString()}`);
  }
  console.log("Plain-text bytes:   ", plainBytes.toLocaleString());
  console.log("Generated file bytes:", outputBytes.toLocaleString());
  console.log("Reduction:          ", `${(100 * (1 - outputBytes / plainBytes)).toFixed(1)}%`);

  if (dryRun) {
    console.log(`\n[dry-run] Would write to ${OUTPUT_PATH}`);
    return;
  }

  writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`\nWrote ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
