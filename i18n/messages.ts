import type { Locale } from './locale';

// English is the source of truth. Italian is typed against it, so a missing key fails typecheck.
const en = {
  'language.label': 'Language',
  'language.english': 'English',
  'language.italian': 'Italiano',
};

export type MessageKey = keyof typeof en;

const it: Record<MessageKey, string> = {
  'language.label': 'Lingua',
  'language.english': 'English',
  'language.italian': 'Italiano',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, it };

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
