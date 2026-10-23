'use client';

import { useId } from 'react';
import { isLocale } from '../../i18n/locale';
import { useLocale } from './LocaleProvider';
import styles from './LanguageSelect.module.css';

// Each language is named in its own language, so someone who reads the wrong one can still find theirs.
const OPTIONS = [
  { value: 'en', labelKey: 'language.english' },
  { value: 'it', labelKey: 'language.italian' },
] as const;

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocale();
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {t('language.label')}
      </label>
      <select
        id={id}
        className={styles.select}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
