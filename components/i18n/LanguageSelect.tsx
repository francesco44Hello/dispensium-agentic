'use client';

import { useId } from 'react';
import type { Locale } from '../../i18n/locale';
import { useLocale } from './LocaleProvider';
import styles from './LanguageSelect.module.css';

// Each language is named in its own language, so someone who reads the wrong one can still find theirs.
const OPTIONS = [
  { value: 'en', labelKey: 'language.english' },
  { value: 'it', labelKey: 'language.italian' },
] as const;

// Flags are drawn as SVG, not emoji: emoji flags show as letters ("GB", "IT") on Windows.
function Flag({ locale }: { locale: Locale }) {
  if (locale === 'it') {
    return (
      <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="1" height="2" fill="#009246" />
        <rect x="1" width="1" height="2" fill="#ffffff" />
        <rect x="2" width="1" height="2" fill="#ce2b37" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="3" />
      <path d="M30,0 V30 M0,15 H60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocale();
  const name = useId();
  const labelId = useId();

  return (
    <div className={styles.field} role="radiogroup" aria-labelledby={labelId}>
      <span id={labelId} className={styles.label}>
        {t('language.label')}
      </span>
      <div className={styles.options}>
        {OPTIONS.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              className={styles.input}
              checked={locale === option.value}
              onChange={() => setLocale(option.value)}
            />
            <span className={styles.flag}>
              <Flag locale={option.value} />
            </span>
            <span>{t(option.labelKey)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
