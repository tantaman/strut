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
for (const [len, words] of byLen) {
  // if (len < 4) {
  //   continue;
  // }
  for (const w of words) {
    shortWords.push(w.toLowerCase());
  }
  if (shortWords.length >= Math.pow(2, 16)) {
    break;
  }
}

console.log(shortWords.slice(0, Math.pow(2, 16)));
