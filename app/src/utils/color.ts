export function hsvToRgb(
  h: number,
  s: number,
  v: number
): [number, number, number] {
  h = h % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rp: number = 0;
  let gp: number = 0;
  let bp: number = 0;
  // Between 0 and 120 degrees on the color wheel there is no blue
  if (h >= 0 && h < 60) {
    rp = c;
    gp = x;
    bp = 0;
  } else if (h >= 60 && h < 120) {
    rp = x;
    gp = c;
    bp = 0;
  } else if (h >= 120 && h < 180) {
    rp = 0;
    gp = c;
    bp = x;
  } else if (h >= 180 && h < 240) {
    rp = 0;
    gp = x;
    bp = c;
  } else if (h >= 240 && h < 300) {
    rp = x;
    gp = 0;
    bp = c;
  } else if (h >= 300 && h < 360) {
    rp = c;
    gp = 0;
    bp = x;
  }

  return [
    Math.floor((rp + m) * 255),
    Math.floor((gp + m) * 255),
    Math.floor((bp + m) * 255),
  ];
}

export function rgbToHsv(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const [rp, gp, bp] = [r, g, b].map((x) => x / 255.0);
  const cMax = Math.max(rp, gp, bp);
  const cMin = Math.min(rp, gp, bp);
  const delta = cMax - cMin;

  let hue = 0;
  if (delta === 0) {
    hue = 0;
  } else if (cMax === rp) {
    hue = 60 * (((gp - bp) / delta) % 6);
  } else if (cMax === gp) {
    hue = 60 * ((bp - rp) / delta + 2);
  } else if (cMax === bp) {
    hue = 60 * ((rp - gp) / delta + 4);
  }

  let sat = 0;
  if (cMax === 0) {
    sat = 0;
  } else {
    sat = delta / cMax;
  }

  const value = cMax;

  return [hue, sat, value];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const pad = (v: string) => (v.length === 1 ? "0" + v : v);
  return "#" + pad(r.toString(16)) + pad(g.toString(16)) + pad(b.toString(16));
}
