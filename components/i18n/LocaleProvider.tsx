'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { DEFAULT_LOCALE, resolveLocale, type Locale } from '../../i18n/locale';
import { translate, type MessageKey } from '../../i18n/messages';

const STORAGE_KEY = 'dispensium-locale';

interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

// Outside a provider the app stays in English, so a component renders correctly even in isolation.
const ENGLISH: LocaleValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key) => translate(DEFAULT_LOCALE, key),
};

const LocaleContext = createContext<LocaleValue>(ENGLISH);

// Storage can be blocked (private windows, disabled site data). The app still works, in the default language.
function readSavedLocale(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSavedLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // The choice still applies for this visit.
  }
}

// The device choice lives in localStorage and is read through useSyncExternalStore, so every component
// sees the same value, and the server render (English) matches the first client render.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLocale(): Locale {
  return resolveLocale({ saved: readSavedLocale(), account: undefined, browser: navigator.language });
}

function getServerLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocale, getServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    writeSavedLocale(next);
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo<LocaleValue>(
    () => ({ locale, setLocale, t: (key) => translate(locale, key) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  return useContext(LocaleContext);
}
