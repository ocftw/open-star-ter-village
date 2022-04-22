import { filterInplace, isInRange, zip } from "./utils";

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

  describe('zip', () => {
    it('should zip two lists to be one list of tuples', () => {
      const array1 = [3, 2, 1];
      const array2 = ['foo', 'bar', 'foobar'];
      const results = zip(array1, array2);
      expect(results[0]).toEqual([3, 'foo']);
      expect(results[1]).toEqual([2, 'bar']);
      expect(results[2]).toEqual([1, 'foobar']);
    });
  });

  describe('filterInplace', () => {
    it('should filter inplace', () => {
      const array = [1, 2, 3, 4, 5];
      filterInplace(array, x => x % 2 == 0);
      expect(array).toEqual([2, 4]);
    });
  });
});
