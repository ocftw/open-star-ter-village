import { canScrollNext, canScrollPrev, maxScrollLeft, pageStep, pageTarget } from './marketCarousel';

const m = (scrollLeft: number, clientWidth = 560, scrollWidth = 1072) => ({ scrollLeft, clientWidth, scrollWidth });

describe('pageStep', () => {
  it.each([
    [560, 134, 3],
    [800, 134, 4],
    [358, 106, 2],
    [200, 134, 1],
    [100, 134, 1],
  ])('width %i step %i pages %i tiles (floor(width/step) - 1, min 1)', (width, step, expected) => {
    expect(pageStep(width, step)).toBe(expected);
  });
  it('falls back to one tile for a degenerate step', () => {
    expect(pageStep(500, 0)).toBe(1);
  });
});

describe('edge detection with 2px tolerance', () => {
  it('has no previous content within 2px of the start', () => {
    expect(canScrollPrev(m(0))).toBe(false);
    expect(canScrollPrev(m(2))).toBe(false);
    expect(canScrollPrev(m(3))).toBe(true);
  });
  it('has no next content within 2px of the end', () => {
    expect(canScrollNext(m(0))).toBe(true);
    expect(canScrollNext(m(510))).toBe(false); // max = 512
    expect(canScrollNext(m(509))).toBe(true);
    expect(canScrollNext(m(512))).toBe(false);
  });
  it('shows nothing when content fits', () => {
    expect(canScrollNext(m(0, 600, 600))).toBe(false);
    expect(maxScrollLeft(m(0, 600, 400))).toBe(0);
  });
});

describe('pageTarget', () => {
  it('pages forward by whole tiles from the start', () => {
    expect(pageTarget(m(0), 134, 1)).toBe(3 * 134);
  });
  it('snaps to a tile edge when mid-tile', () => {
    expect(pageTarget(m(150, 560, 1600), 134, 1)).toBe(4 * 134);
  });
  it('lands exactly on the end when the target is within half a tile of it', () => {
    expect(pageTarget(m(300), 134, 1)).toBe(512);
  });
  it('never goes past the end', () => {
    expect(pageTarget(m(512), 134, 1)).toBe(512);
  });
  it('pages back and never below 0', () => {
    expect(pageTarget(m(536, 560, 1600), 134, -1)).toBe(134);
    expect(pageTarget(m(134), 134, -1)).toBe(0);
    expect(pageTarget(m(0), 134, -1)).toBe(0);
  });
  it('moves at least one tile in narrow rows', () => {
    expect(pageTarget(m(0, 200, 1072), 134, 1)).toBe(134);
  });
  it('is stable with a zero tile step', () => {
    expect(pageTarget(m(40), 0, 1)).toBe(40);
  });
});
