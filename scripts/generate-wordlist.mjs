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
  const body = sorted.join(" ");
  const header = `// Auto-generated word list (dwyl/english-words words_alpha.txt, filtered to ${MIN_LEN}-${MAX_LEN} lowercase letters).\n// Source: https://github.com/dwyl/english-words (words_alpha.txt)\n// Regenerate with: node scripts/generate-wordlist.mjs\n`;
  const output = `${header}export const WORD_LIST_RAW = \`${body}\`;\n`;

  const rawBytes = Buffer.byteLength(output, "utf8");
  const gzipBytes = gzipSync(output).length;

  console.log("Source lines:      ", lines.length.toLocaleString());
  console.log("Kept words:         ", sorted.length.toLocaleString());
  console.log("Dropped lines:      ", droppedCount.toLocaleString());
  console.log("Length histogram:");
  for (const len of Array.from(histogram.keys()).sort((a, b) => a - b)) {
    console.log(`  ${String(len).padStart(2, " ")}: ${histogram.get(len).toLocaleString()}`);
  }
  console.log("Output raw bytes:   ", rawBytes.toLocaleString());
  console.log("Output gzip bytes:  ", gzipBytes.toLocaleString());

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
