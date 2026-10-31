'use client';

import { useId } from 'react';
import { useLocale } from './LocaleProvider';
import { LanguageFlag } from './LanguageFlag';
import styles from './LanguageSelect.module.css';

// Each language is named in its own language, so someone who reads the wrong one can still find theirs.
const OPTIONS = [
  { value: 'en', labelKey: 'language.english' },
  { value: 'it', labelKey: 'language.italian' },
] as const;

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
              <LanguageFlag locale={option.value} />
            </span>
            <span>{t(option.labelKey)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
