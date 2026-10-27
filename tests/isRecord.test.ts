import { describe, it, expect } from 'vitest';
import { isRecord } from '../utils/isRecord';

describe('isRecord', () => {
  it('accepts plain objects', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('rejects null, arrays and primitives', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
    expect(isRecord('text')).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});
