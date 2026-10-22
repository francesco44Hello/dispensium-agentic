import { describe, it, expect, vi } from 'vitest';
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '../utils/inviteCode';

describe('generateInviteCode', () => {
  it('produces an 8-character code that passes validation', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
    expect(isValidInviteCode(code)).toBe(true);
  });

  it('uses the first alphabet character when random returns 0', () => {
    expect(generateInviteCode(() => 0)).toBe('AAAAAAAA');
  });

  it('uses the last alphabet character when random is just below 1', () => {
    expect(generateInviteCode(() => 0.999999)).toBe('99999999');
  });

  it('never produces ambiguous characters I, O, 0 or 1', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).not.toMatch(/[IO01]/);
    }
  });

  it('draws from crypto.getRandomValues and not Math.random', () => {
    const cryptoSpy = vi.spyOn(crypto, 'getRandomValues');
    const mathSpy = vi.spyOn(Math, 'random');
    try {
      generateInviteCode();
      expect(cryptoSpy).toHaveBeenCalled();
      expect(mathSpy).not.toHaveBeenCalled();
    } finally {
      cryptoSpy.mockRestore();
      mathSpy.mockRestore();
    }
  });

  it('keeps the 32-character alphabet: every character appears and nothing else does', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      for (const char of generateInviteCode()) seen.add(char);
    }
    expect([...seen].sort().join('')).toBe('23456789ABCDEFGHJKLMNPQRSTUVWXYZ');
  });
});

describe('normalizeInviteCode', () => {
  it('uppercases and strips spaces and dashes', () => {
    expect(normalizeInviteCode(' abcd-2345 ')).toBe('ABCD2345');
  });
});

describe('isValidInviteCode', () => {
  it('accepts a valid code', () => {
    expect(isValidInviteCode('ABCD2345')).toBe(true);
  });

  it('rejects the wrong length', () => {
    expect(isValidInviteCode('ABCD234')).toBe(false);
    expect(isValidInviteCode('ABCD23456')).toBe(false);
  });

  it('rejects ambiguous characters', () => {
    expect(isValidInviteCode('ABCDI234')).toBe(false);
    expect(isValidInviteCode('ABCDO234')).toBe(false);
    expect(isValidInviteCode('ABCD0234')).toBe(false);
    expect(isValidInviteCode('ABCD1234')).toBe(false);
  });

  it('rejects lowercase input (normalise first)', () => {
    expect(isValidInviteCode('abcd2345')).toBe(false);
  });
});
