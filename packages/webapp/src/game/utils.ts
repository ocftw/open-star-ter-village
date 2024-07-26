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
