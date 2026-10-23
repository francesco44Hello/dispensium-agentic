'use client';

import { useState, type FormEvent } from 'react';
import { MdFileDownload } from 'react-icons/md';
import type { ExtractedRecipe } from '../../types/recipe';
import { isExtractedRecipe } from '../../utils/isExtractedRecipe';
import { currentIdToken } from '../../services/authClient';
import styles from './ImportPanel.module.css';
import { useLocale } from '../i18n/LocaleProvider';

interface Props {
  onImported: (recipe: ExtractedRecipe) => void;
}

// Sends the link to our own route, which fetches the page and reads its recipe data.
export function ImportPanel({ onImported }: Props) {
  const { t } = useLocale();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await currentIdToken()}` },
        body: JSON.stringify({ url }),
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof data === 'object' && data !== null && 'error' in data ? String(data.error) : '';
        throw new Error(message || 'Import failed. Try another link.');
      }
      if (!isExtractedRecipe(data)) throw new Error('Import failed. Try another link.');
      onImported(data);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recipes.importFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.panel} aria-label={t('recipes.importTitle')}>
      <h3 className={styles.title}>{t('recipes.importTitle')}</h3>
      <p className={styles.subtitle}>{t('recipes.importSubtitle')}</p>
      <form className={styles.form} onSubmit={handleImport}>
        <input
          type="url"
          placeholder="https://..."
          aria-label={t('recipes.importLink')}
          className={styles.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" className={styles.button} disabled={loading}>
          <MdFileDownload aria-hidden="true" />
          {loading ? t('recipes.importing') : t('recipes.import')}
        </button>
      </form>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </section>
  );
}
