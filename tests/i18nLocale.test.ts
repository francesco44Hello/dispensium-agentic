import { describe, it, expect } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale, resolveLocale } from '../i18n/locale';
import { messages, translateStored, RECIPE_CATEGORY_KEYS, type MessageKey } from '../i18n/messages';

describe('isLocale', () => {
  it('accepts only the supported locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('it')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('IT')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('resolveLocale', () => {
  it('uses the saved choice first', () => {
    expect(resolveLocale({ saved: 'it', account: 'en', browser: 'en-US' })).toBe('it');
  });

  it('falls back to the account locale when nothing is saved on this device', () => {
    expect(resolveLocale({ saved: null, account: 'it', browser: 'en-US' })).toBe('it');
  });

  it('falls back to an Italian browser language', () => {
    expect(resolveLocale({ saved: null, account: undefined, browser: 'it-IT' })).toBe('it');
  });

  it('uses English for any other browser language', () => {
    expect(resolveLocale({ saved: null, account: undefined, browser: 'fr-FR' })).toBe('en');
    expect(resolveLocale({ saved: null, account: undefined, browser: undefined })).toBe(DEFAULT_LOCALE);
  });

  it('ignores a saved value that is not a supported locale', () => {
    expect(resolveLocale({ saved: 'de', account: 'it', browser: 'en-US' })).toBe('it');
  });
});

describe('messages', () => {
  it('has a non-empty Italian text for every English key', () => {
    for (const locale of LOCALES) {
      for (const [key, text] of Object.entries(messages.en)) {
        expect(text, `${locale}: ${key}`).not.toBe('');
      }
    }
    expect(Object.keys(messages.it).sort()).toEqual(Object.keys(messages.en).sort());
  });
});

describe('translateStored', () => {
  const t = (key: MessageKey) => messages.it[key];

  it('shows the translation of a known stored value', () => {
    expect(translateStored('Dinner', RECIPE_CATEGORY_KEYS, t)).toBe('Cena');
  });

  it('shows an unknown stored value as it is stored', () => {
    expect(translateStored('Brunch', RECIPE_CATEGORY_KEYS, t)).toBe('Brunch');
  });
});
