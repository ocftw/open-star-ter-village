export const isInRange = (val: number, a: number, b?: number) => {
  if (typeof b !== 'number') {
    b = a;
    a = 0;
  }
  return a <= val && val < b;
}
