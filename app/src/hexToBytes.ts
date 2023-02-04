export default function hexToBytes(hex: string) {
  let bytes = new Uint8Array(hex.length / 2);
  for (let c = 0; c < hex.length; c += 2)
    bytes[c / 2] = parseInt(hex.substring(c, c + 2), 16);
  return bytes;
}
