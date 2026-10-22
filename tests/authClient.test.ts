import { describe, it, expect } from 'vitest';
import { resolveAuthMode } from '../services/authClient';

describe('resolveAuthMode', () => {
  it('uses mock auth in development when NEXT_PUBLIC_AUTH_MOCK is "true", and refuses it in production', () => {
    expect(resolveAuthMode({ mockFlag: 'true', apiKey: undefined, nodeEnv: 'development' })).toBe('mock');
    expect(() => resolveAuthMode({ mockFlag: 'true', apiKey: 'key', nodeEnv: 'production' })).toThrow(
      /NEXT_PUBLIC_AUTH_MOCK.*production/,
    );
  });

  it('refuses mock auth in a production build, even when the Firebase key is present', () => {
    expect(() => resolveAuthMode({ mockFlag: 'true', apiKey: undefined, nodeEnv: 'production' })).toThrow(
      /NEXT_PUBLIC_AUTH_MOCK.*production/,
    );
    expect(() => resolveAuthMode({ mockFlag: 'true', apiKey: 'real-key', nodeEnv: 'production' })).toThrow(
      /NEXT_PUBLIC_AUTH_MOCK.*production/,
    );
  });

  it('still allows mock auth in local development and test runs', () => {
    expect(resolveAuthMode({ mockFlag: 'true', apiKey: undefined, nodeEnv: 'test' })).toBe('mock');
  });

  it('does not fall back to mock auth just because the API key is missing in development', () => {
    expect(resolveAuthMode({ mockFlag: undefined, apiKey: undefined, nodeEnv: 'development' })).toBe('firebase');
    expect(resolveAuthMode({ mockFlag: 'false', apiKey: '', nodeEnv: 'development' })).toBe('firebase');
  });

  it('uses Firebase in production when the key is present', () => {
    expect(resolveAuthMode({ mockFlag: undefined, apiKey: 'real-key', nodeEnv: 'production' })).toBe('firebase');
  });

  it('throws a clear error in production when the key is missing and mock is not explicit', () => {
    expect(() => resolveAuthMode({ mockFlag: undefined, apiKey: undefined, nodeEnv: 'production' })).toThrow(
      /NEXT_PUBLIC_FIREBASE_API_KEY is missing/,
    );
    expect(() => resolveAuthMode({ mockFlag: 'false', apiKey: '', nodeEnv: 'production' })).toThrow(
      /NEXT_PUBLIC_FIREBASE_API_KEY is missing/,
    );
  });

  it('treats any flag value other than "true" as not mock', () => {
    expect(resolveAuthMode({ mockFlag: '1', apiKey: 'key', nodeEnv: 'development' })).toBe('firebase');
    expect(resolveAuthMode({ mockFlag: 'TRUE', apiKey: 'key', nodeEnv: 'development' })).toBe('firebase');
  });
});
