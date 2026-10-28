'use client';

import { useLocale } from '../i18n/LocaleProvider';
import styles from './AppFooter.module.css';

// The footer from the mobile menu, shown at the bottom of the desktop pages.
export function AppFooter() {
  const { t } = useLocale();
  return (
    <footer className={styles.footer}>
      <p>© Francesco Longo</p>
      <p>2026</p>
      <p>{t('menu.rights')}</p>
    </footer>
  );
}
