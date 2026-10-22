export const LOCALES = ['en', 'it'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

interface LocaleSources {
  // The choice the person made on this device.
  saved: string | null | undefined;
  // The locale stored on their account (users/{uid}).
  account: string | null | undefined;
  // The browser language, such as 'it-IT'.
  browser: string | null | undefined;
}

// First valid source wins: the device choice, then the account, then the browser, then English.
export function resolveLocale({ saved, account, browser }: LocaleSources): Locale {
  if (isLocale(saved)) return saved;
  if (isLocale(account)) return account;
  if (browser?.toLowerCase().startsWith('it')) return 'it';
  return DEFAULT_LOCALE;
}
