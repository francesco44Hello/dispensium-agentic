'use client';

import { useState, type KeyboardEvent } from 'react';
import { LOCALES, LOCALE_FLAGS, type Locale } from '../../i18n/locale';
import type { MessageKey } from '../../i18n/messages';
import { useLocale } from './LocaleProvider';
import styles from './LanguageSwitch.module.css';

const LABEL_KEYS: Record<Locale, MessageKey> = { en: 'language.english', it: 'language.italian' };

// A round flag button that opens a small menu. Each language is named in its own language.
export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') setOpen(false);
  }

  return (
    <div className={styles.wrap} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t('landing.language.change')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
      </button>
      {open && (
        <div role="menu" className={styles.menu}>
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              className={styles.option}
              aria-current={option === locale ? 'true' : undefined}
              onClick={() => choose(option)}
            >
              <span aria-hidden="true">{LOCALE_FLAGS[option]}</span>
              {t(LABEL_KEYS[option])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
