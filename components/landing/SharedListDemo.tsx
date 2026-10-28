'use client';

import { useState } from 'react';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './SharedListDemo.module.css';

interface Entry {
  key: MessageKey;
  done: boolean;
}

const HOUSEHOLD: MessageKey[] = ['landing.share.mum', 'landing.share.dad'];
const SUGGESTIONS: MessageKey[] = ['landing.share.courgette', 'landing.share.bread', 'landing.share.eggs'];

// Both phones read one list, so this is a picture of the shared household list, not two copies.
// Nothing here talks to Firebase: it is a demo that runs only in the page.
export function SharedListDemo() {
  const { t } = useLocale();
  const [entries, setEntries] = useState<Entry[]>([{ key: 'landing.share.milk', done: false }]);

  function add(key: MessageKey) {
    setEntries((current) => (current.some((entry) => entry.key === key) ? current : [...current, { key, done: false }]));
  }

  function toggle(key: MessageKey) {
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, done: !entry.done } : entry)));
  }

  return (
    <div className={styles.demo}>
      <div className={styles.phones}>
        {HOUSEHOLD.map((who) => (
          <section key={who} className={styles.phone} aria-label={t(who)}>
            <p className={styles.phoneName}>{t(who)}</p>
            <ul className={styles.list}>
              {entries.map((entry) => (
                <li key={entry.key}>
                  <label className={styles.row}>
                    <input type="checkbox" className={styles.box} checked={entry.done} onChange={() => toggle(entry.key)} />
                    <span className={entry.done ? styles.done : undefined}>{t(entry.key)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className={styles.chips}>
        {SUGGESTIONS.map((key) => (
          <button
            key={key}
            type="button"
            className={styles.chip}
            disabled={entries.some((entry) => entry.key === key)}
            onClick={() => add(key)}
          >
            {t('landing.share.add', { item: t(key) })}
          </button>
        ))}
      </div>
      <p className={styles.hint}>{t('landing.share.hint')}</p>
    </div>
  );
}
