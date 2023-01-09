#!/usr/bin/env node
/**
 * - Grab the 65536 shortest words
 * - Randomize
 * - Throw into an array
 */

const fs = require("fs");

const words = fs.readFileSync("words.txt", "utf8").split("\n");

const byLen = new Map();
for (const word of words) {
  const len = word.length;
  if (!byLen.has(len)) {
    byLen.set(len, []);
  }
  byLen.get(len).push(word);
}

let shortWords = [];
const byLenSorted = Array.from(byLen.entries()).sort((a, b) => a[0] - b[0]);
const seen = new Set();
for (const [len, words] of byLenSorted) {
  // if (len < 4) {
  //   continue;
  // }
  for (const w of words) {
    const lower = w.toLowerCase();
    if (w.indexOf(" ") != -1 || w.trim() === "" || seen.has(lower)) {
      continue;
    }
    seen.add(lower);
    shortWords.push(lower);
  }
  if (shortWords.length >= Math.pow(2, 16)) {
    break;
  }
}

console.log(
  "export default " + JSON.stringify(shortWords.slice(0, Math.pow(2, 16)))
);
