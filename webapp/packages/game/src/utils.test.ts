import { isInRange } from "./utils";

describe('utils', () => {
  describe('isInRange', () => {
    describe('given upper bound', () => {
      test.each([
        [1, 2],
        [2, 10],
        [0, 5],
        [3, 4],
      ])('is in the range', (val, upperBond) => {
        expect(isInRange(val, upperBond)).toBeTruthy();
      });

      test.each([
        [3, 2],
        [-1, 10],
        [5, 5],
        [100, 4],
      ])('is NOT in the range', (val, upperBond) => {
        expect(isInRange(val, upperBond)).toBeFalsy();
      });
    });

    describe('given lower bound and upper bound', () => {
      test.each([
        [3, 2, 4],
        [0, 0, 3],
        [-2, -5, 5],
        [3, -1, 4],
      ])('is in the range', (val, lowerBond, upperBond) => {
        expect(isInRange(val, lowerBond, upperBond)).toBeTruthy();
      });

      test.each([
        [-2, 1, 4],
        [-4, -1, 3],
        [5, 0, 5],
        [6, 1, 3],
      ])('is NOT in the range', (val, lowerBond, upperBond) => {
        expect(isInRange(val, lowerBond, upperBond)).toBeFalsy();
      });
    });
  });
});
