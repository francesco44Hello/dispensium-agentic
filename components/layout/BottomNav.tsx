'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import { MdAdd, MdCalendarMonth, MdChecklist, MdGridView, MdRestaurant } from 'react-icons/md';
import styles from './BottomNav.module.css';

type Tab = { label: string; icon: IconType; href: string };

const TABS: Tab[] = [
  { label: 'Shopping', icon: MdChecklist, href: '/' },
  { label: 'Recipes', icon: MdRestaurant, href: '/recipes' },
  { label: 'Menu', icon: MdCalendarMonth, href: '/weekly-menu' },
  { label: 'Manage', icon: MdGridView, href: '/manage-categories' },
];

interface Props {
  // Passed on the recipes page only: shows the floating add button.
  onAdd?: () => void;
}

export function BottomNav({ onAdd }: Props) {
  const pathname = usePathname();
  const showAdd = pathname === '/recipes' && onAdd;

  return (
    <nav className={styles.nav} aria-label="Main">
      {TABS.map(({ label, icon: Icon, href }) => {
        const isCurrent = pathname === href;
        return (
          <Link key={label} href={href} className={styles.tab} aria-current={isCurrent ? 'page' : undefined}>
            <span className={`${styles.iconWrap} ${isCurrent ? styles.active : ''}`}>
              <Icon aria-hidden="true" />
            </span>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
      {showAdd && (
        <button type="button" className={styles.fab} aria-label="Add recipe" onClick={onAdd}>
          <MdAdd aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}
