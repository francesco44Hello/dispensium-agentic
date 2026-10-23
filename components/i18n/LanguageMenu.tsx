'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { LOCALES, LOCALE_FLAGS, type Locale } from '../../i18n/locale';
import { useLocale } from './LocaleProvider';
import styles from './LanguageMenu.module.css';

// Each language is named in its own language, as in the other language pickers.
const NAME_KEYS = { en: 'language.english', it: 'language.italian' } as const;

// The current language shows as a flag. Opening it lists the other languages.
export function LanguageMenu() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const others = LOCALES.filter((option) => option !== locale);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.toggle}
        aria-label={t('language.change')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={t('language.change')} className={styles.list}>
          {others.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={false}
              tabIndex={0}
              className={styles.option}
              onClick={() => choose(option)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') choose(option);
              }}
            >
              <span aria-hidden="true">{LOCALE_FLAGS[option]}</span> {t(NAME_KEYS[option])}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
