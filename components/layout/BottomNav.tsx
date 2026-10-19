'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import { MdCalendarMonth, MdChecklist, MdGridView, MdRestaurant } from 'react-icons/md';
import styles from './BottomNav.module.css';

type Tab = { label: string; icon: IconType; href?: string };

// Only Shopping is built so far; the other tabs are shown but unavailable.
const TABS: Tab[] = [
  { label: 'Shopping', icon: MdChecklist, href: '/' },
  { label: 'Recipes', icon: MdRestaurant },
  { label: 'Menu', icon: MdCalendarMonth },
  { label: 'Manage', icon: MdGridView },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Main">
      {TABS.map(({ label, icon: Icon, href }) => {
        const isCurrent = href !== undefined && pathname === href;
        const content = (
          <>
            <span className={`${styles.iconWrap} ${isCurrent ? styles.active : ''}`}>
              <Icon aria-hidden="true" />
            </span>
            <span className={styles.label}>{label}</span>
          </>
        );
        return href ? (
          <Link key={label} href={href} className={styles.tab} aria-current={isCurrent ? 'page' : undefined}>
            {content}
          </Link>
        ) : (
          <span key={label} className={`${styles.tab} ${styles.disabled}`} aria-disabled="true">
            {content}
          </span>
        );
      })}
    </nav>
  );
}
