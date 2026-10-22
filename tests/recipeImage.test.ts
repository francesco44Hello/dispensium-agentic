import { describe, it, expect } from 'vitest';
import { fitWithin, isAllowedImageType, MAX_PHOTO_BYTES, OUTPUT_TYPE } from '../utils/recipeImage';

describe('fitWithin', () => {
  it('scales a large photo down so its longest side is the limit, keeping the ratio', () => {
    expect(fitWithin(4000, 2000, 1200)).toEqual({ width: 1200, height: 600 });
    expect(fitWithin(1000, 3000, 1200)).toEqual({ width: 400, height: 1200 });
  });

  it('never enlarges a small photo', () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });
});

describe('isAllowedImageType', () => {
  it('accepts jpeg, png and webp, and rejects everything else', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true);
    expect(isAllowedImageType('image/png')).toBe(true);
    expect(isAllowedImageType('image/webp')).toBe(true);
    expect(isAllowedImageType('image/svg+xml')).toBe(false);
    expect(isAllowedImageType('text/html')).toBe(false);
  });
});

describe('constants', () => {
  it('stores photos as webp and caps them at 1 MB, the same limit as the storage rules', () => {
    expect(OUTPUT_TYPE).toBe('image/webp');
    expect(MAX_PHOTO_BYTES).toBe(1024 * 1024);
  });
});
