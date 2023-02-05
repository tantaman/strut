import dictionary from "./dictionary.js";

const reverseIndex = new Map<string, number>();
for (let i = 0; i < dictionary.length; i++) {
  reverseIndex.set(dictionary[i], i);
}

export function hexToMnemonic(hex: string) {
  const words: string[] = [];
  for (let i = 0; i < hex.length; i += 4) {
    const word = dictionary[parseInt(hex.substring(i, i + 4), 16)];
    words.push(word);
  }
  return words.join(" ");
}

export function bytesToMnemonic(bytes: Uint8Array) {
  const words: string[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    const word = dictionary[bytes[i] * 256 + bytes[i + 1]];
    words.push(word);
  }
  return words.join(" ");
}

export function uuidToMnemonic(uuid: string) {
  const hex = uuid.replace(/-/g, "");
  return hexToMnemonic(hex);
}

export function mnemonicToBytes(mnemonic: string) {
  const words = mnemonic.split(" ");
  const bytes: Uint8Array = new Uint8Array(words.length * 2);
  for (let i = 0; i < words.length; ++i) {
    const word = words[i];
    const index = reverseIndex.get(word)!;
    bytes[i * 2] = index >> 8;
    bytes[i * 2 + 1] = index & 0xff;
  }
  return new Uint8Array(bytes);
}
