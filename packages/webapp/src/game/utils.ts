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

export function filterInplace<T>(array: T[], condition: (t: T, i: number, thisArg: T[]) => boolean) {
  let writePtr = 0;
  let readPtr = 0;
  while (readPtr < array.length) {
    if (condition(array[readPtr], readPtr, array)) {
      array[writePtr] = array[readPtr];
      writePtr++;
    }
    readPtr++;
  }
  array.length = writePtr;
}

export function reservoirSampling<T>(array: T[], k: number, randomFn: () => number = Math.random): T[] {
  const reservoir = array.slice(0, k);
  for (let i = k; i < array.length; i++) {
    const j = Math.floor(randomFn() * (i + 1));
    if (j < k) {
      reservoir[j] = array[i];
    }
  }
  return reservoir;
}
