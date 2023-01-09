import { test, expect } from "vitest";
import fc from "fast-check";
import { bytesToMnemonic, hexToMnemonic, mnemonicToBytes } from "../index.js";

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let c = 0; c < hex.length; c += 2) {
    bytes[c / 2] = parseInt(hex.substr(c, 2), 16);
  }
  return bytes;
}

test("encode then decode, hex", () => {
  fc.assert(
    fc.property(fc.hexaString({ minLength: 32, maxLength: 32 }), (hex) => {
      const bytes = hexToBytes(hex);

      const mnemonic = bytesToMnemonic(bytes);
      console.log(mnemonic);
      const decoded = mnemonicToBytes(mnemonic);
      const menomnicFromHex = hexToMnemonic(hex);

      expect(menomnicFromHex).toEqual(mnemonic);
      expect(decoded).toEqual(bytes);
    })
  );
});

test("encode then decode, bytes", () => {
  fc.assert(
    fc.property(fc.uint8Array({ minLength: 16, maxLength: 16 }), (bytes) => {
      const mnemonic = bytesToMnemonic(bytes);
      const decoded = mnemonicToBytes(mnemonic);

      expect(decoded).toEqual(bytes);
    })
  );
});

test("failing case", () => {
  // const hex = "3000";
  const bytes = Uint8Array.from([0, 202]);

  const mnemonic = bytesToMnemonic(bytes);
  const decoded = mnemonicToBytes(mnemonic);
  // const menomnicFromHex = hexToMnemonic(hex);

  // expect(menomnicFromHex).toEqual(mnemonic);
  expect(decoded).toEqual(bytes);
});
