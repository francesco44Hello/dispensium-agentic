'use client';

import Link from 'next/link';
import { MdChevronRight, MdClose } from 'react-icons/md';
import { LanguageSelect } from '../i18n/LanguageSelect';
import styles from './SideMenu.module.css';

// The side menu, copied from the legacy app: the app name, tagline, the Explore links and the footer.
const LINKS = [
  { label: 'Shopping List', href: '/' },
  { label: 'Recipes', href: '/recipes' },
  { label: 'Weekly Menu', href: '/weekly-menu' },
  { label: 'Household', href: '/household' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose }: Props) {
  return (
    <>
      <div className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`} onClick={onClose} aria-hidden="true" />
      <aside aria-label="Menu" data-open={open ? 'true' : 'false'} className={`${styles.container} ${open ? styles.open : ''}`} aria-hidden={!open} inert={!open}>
        <div className={styles.decor} aria-hidden="true" />
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.title}>
              <p className={styles.brand}>Dispensium</p>
              <p className={styles.tagline}>Plan. Shop. Cook.</p>
            </div>
            <button type="button" className={styles.close} aria-label="Close menu" onClick={onClose}>
              <MdClose aria-hidden="true" />
            </button>
          </div>
          <h2 className={styles.explore}>Explore</h2>
          <ul className={styles.links}>
            {LINKS.map(({ label, href }) => (
              <li key={href} className={styles.link}>
                <Link href={href} onClick={onClose}>
                  {label} <MdChevronRight aria-hidden="true" />
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
            <p>All rights Reserved</p>
          </footer>
        </div>
      </aside>
    </>
  );
}
