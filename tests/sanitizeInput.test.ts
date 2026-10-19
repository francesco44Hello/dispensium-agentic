import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../utils/sanitizeInput';

describe('sanitizeInput', () => {
  describe('standard strings', () => {
    it('returns plain text unchanged', () => {
      expect(sanitizeInput('Milk 2L')).toBe('Milk 2L');
    });

    it('keeps letters, digits, spaces and common punctuation', () => {
      expect(sanitizeInput("Olive oil, extra-virgin: 500ml! (fridge) & more?")).toBe(
        "Olive oil, extra-virgin: 500ml! (fridge) & more?"
      );
    });

    it('keeps single quotes and apostrophes', () => {
      expect(sanitizeInput("Mom's eggs")).toBe("Mom's eggs");
    });

    it('returns an empty string for an empty input', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('HTML tags', () => {
    it('strips angle brackets from a script tag, keeping its text', () => {
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    });

    it('strips angle brackets from an img tag with attributes', () => {
      expect(sanitizeInput('<img src=x onerror=y>')).toBe('img src=x onerror=y');
    });

    it('strips lone < and > characters', () => {
      expect(sanitizeInput('a < b > c')).toBe('a  b  c');
    });
  });

  describe('brackets', () => {
    it('strips curly braces', () => {
      expect(sanitizeInput('{key: value}')).toBe('key: value');
    });

    it('keeps square and round brackets, which are not in the blocklist', () => {
      expect(sanitizeInput('[x] (y)')).toBe('[x] (y)');
    });
  });

  describe('quotes', () => {
    it('strips double quotes', () => {
      expect(sanitizeInput('say "hello"')).toBe('say hello');
    });

    it('strips double quotes inside a JSON-like payload', () => {
      expect(sanitizeInput('{"name":"Bread"}')).toBe('name:Bread');
    });
  });

  describe('mixed input', () => {
    it('strips every blocked character in one pass', () => {
      expect(sanitizeInput('<b>{"x"}</b>')).toBe('bx/b');
    });
  });

  describe('non-string input', () => {
    it('returns an empty string for null or undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('returns an empty string for numbers and objects', () => {
      expect(sanitizeInput(42)).toBe('');
      expect(sanitizeInput({ a: 1 })).toBe('');
    });
  });
});
