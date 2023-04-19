export function round(x: number, interval: number) {
  const remainder = x % interval;
  if (remainder >= interval / 2) {
    return x + (interval - remainder);
  }
  return x - remainder;
}

export function floor(x: number, interval: number) {
  return x - (x % interval);
}

export function ceil(x: number, interval: number) {
  const remainder = x % interval;
  if (remainder === 0) {
    return x;
  }
  return x + (interval - remainder);
}
