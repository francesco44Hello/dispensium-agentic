'use client';

import { CATEGORY_KEYS, translateStored } from '../../i18n/messages';
import { useLocale } from '../i18n/LocaleProvider';
import { AppIcon, type AppIconName } from '../icons/AppIcon';
import type { GroceryItem } from '../../types/grocery';
import { GroceryItemRow } from './GroceryItemRow';
import styles from './CategoryGroup.module.css';

// 'other' has no icon in the set, so its heading shows the name alone.
const CATEGORY_ICONS: Partial<Record<string, AppIconName>> = {
  fruits: 'cat-fruits',
  vegetables: 'cat-vegetables',
  dairy: 'cat-dairy',
  meat: 'cat-meat',
  fish: 'cat-fish',
  bakery: 'cat-bakery',
  pantry: 'cat-pantry-shelf',
  snacks: 'cat-snacks',
  drinks: 'cat-drinks',
  household: 'cat-household',
};

type CategoryGroupProps = {
  category: string;
  items: GroceryItem[];
  onToggle: (id: string, completed: boolean) => void;
};

export function CategoryGroup({ category, items, onToggle }: CategoryGroupProps) {
  const { t } = useLocale();
  const label = translateStored(category, CATEGORY_KEYS, t);
  const icon = CATEGORY_ICONS[category];
  return (
    <section className={styles.group}>
      <h2 className={styles.heading}>
        {icon && <AppIcon name={icon} className={styles.icon} />}
        {label}
      </h2>
      <ul className={styles.items}>
        {items.map((item) => (
          <GroceryItemRow key={item.id} item={item} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  );
}
