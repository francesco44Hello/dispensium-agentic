import { describe, it, expect } from 'vitest';
import { hasCode } from '../utils/hasCode';

describe('hasCode', () => {
  it('accepts an object whose code is a string', () => {
    expect(hasCode({ code: 'auth/wrong-password' })).toBe(true);
    expect(hasCode(Object.assign(new Error('boom'), { code: 'not-found' }))).toBe(true);
  });

  it('refuses a missing, non-string or null code', () => {
    expect(hasCode({})).toBe(false);
    expect(hasCode({ code: 404 })).toBe(false);
    expect(hasCode({ code: undefined })).toBe(false);
    expect(hasCode({ code: null })).toBe(false);
  });

  it('refuses values that are not objects', () => {
    expect(hasCode(null)).toBe(false);
    expect(hasCode(undefined)).toBe(false);
    expect(hasCode('not-found')).toBe(false);
    expect(hasCode(42)).toBe(false);
  });
});
