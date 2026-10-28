'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import { MdAccountCircle, MdAdd, MdCalendarMonth, MdChecklist, MdGroups, MdRestaurant } from 'react-icons/md';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './BottomNav.module.css';

type Tab = { labelKey: MessageKey; icon: IconType; href: string };

const TABS: Tab[] = [
  { labelKey: 'nav.shopping', icon: MdChecklist, href: '/' },
  { labelKey: 'nav.recipes', icon: MdRestaurant, href: '/recipes' },
  { labelKey: 'nav.menu', icon: MdCalendarMonth, href: '/weekly-menu' },
  { labelKey: 'nav.household', icon: MdGroups, href: '/household' },
];

interface Props {
  // Passed on the recipes page only: shows the floating add button.
  onAdd?: () => void;
}

export function BottomNav({ onAdd }: Props) {
  const pathname = usePathname();
  const { t } = useLocale();
  const showAdd = pathname === '/recipes' && onAdd;

  return (
    <nav className={styles.nav} aria-label={t('nav.main')}>
      {TABS.map(({ labelKey, icon: Icon, href }) => {
        const isCurrent = pathname === href;
        return (
          <Link key={labelKey} href={href} className={styles.tab} aria-current={isCurrent ? 'page' : undefined}>
            <span className={`${styles.iconWrap} ${isCurrent ? styles.active : ''}`}>
              <Icon aria-hidden="true" />
            </span>
            <span className={styles.label}>{t(labelKey)}</span>
          </Link>
        );
      })}
      {/* Desktop only: the profile link sits at the far right, where the header used to show it. */}
      <Link
        href="/profile"
        className={`${styles.tab} ${styles.profileTab}`}
        aria-label={t('nav.profile')}
        aria-current={pathname === '/profile' ? 'page' : undefined}
      >
        <MdAccountCircle aria-hidden="true" />
      </Link>
      {showAdd && (
        <button type="button" className={styles.fab} aria-label={t('nav.addRecipe')} onClick={onAdd}>
          <MdAdd aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}
