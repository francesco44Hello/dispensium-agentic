'use client';

import Link from 'next/link';
import { MdChevronRight, MdClose } from 'react-icons/md';
import { LanguageSelect } from '../i18n/LanguageSelect';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './SideMenu.module.css';

// The side menu, copied from the legacy app: the app name, tagline, the Explore links and the footer.
const LINKS: { labelKey: MessageKey; href: string }[] = [
  { labelKey: 'menu.shoppingList', href: '/' },
  { labelKey: 'nav.recipes', href: '/recipes' },
  { labelKey: 'menu.weeklyMenu', href: '/weekly-menu' },
  { labelKey: 'nav.household', href: '/household' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose }: Props) {
  const { t } = useLocale();
  return (
    <>
      <div className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`} onClick={onClose} aria-hidden="true" />
      <aside aria-label={t('menu.label')} data-open={open ? 'true' : 'false'} className={`${styles.container} ${open ? styles.open : ''}`} aria-hidden={!open} inert={!open}>
        <div className={styles.decor} aria-hidden="true" />
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.title}>
              <p className={styles.brand}>Dispensium</p>
              <p className={styles.tagline}>{t('menu.tagline')}</p>
            </div>
            <button type="button" className={styles.close} aria-label={t('menu.close')} onClick={onClose}>
              <MdClose aria-hidden="true" />
            </button>
          </div>
          <h2 className={styles.explore}>{t('menu.explore')}</h2>
          <ul className={styles.links}>
            {LINKS.map(({ labelKey, href }) => (
              <li key={href} className={styles.link}>
                <Link href={href} onClick={onClose}>
                  {t(labelKey)} <MdChevronRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.language}>
            <LanguageSelect />
          </div>
          <footer className={styles.footer}>
            <p>© Francesco Longo</p>
            <p>2026</p>
            <p>{t('menu.rights')}</p>
          </footer>
        </div>
      </aside>
    </>
  );
}
