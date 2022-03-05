export const isInRange = (val: number, a: number, b?: number) => {
  if (typeof b !== 'number') {
    b = a;
    a = 0;
  }
  return a <= val && val < b;
}

export function zip<S = any, T = any>(array1: S[], array2: T[]): [S, T][] {
  const size = Math.min(array1.length, array2.length);
  const results: [S, T][] = new Array(size);
  for (let i = 0; i < size; i++) {
    results[i] = [array1[i], array2[i]];
  }
  return results;
}
