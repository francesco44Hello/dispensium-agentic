'use client';

import { categoryEmojis } from '../../constants/categories';
import { CATEGORY_KEYS } from '../../i18n/messages';
import { useLocale } from '../i18n/LocaleProvider';
import type { GroceryItem } from '../../types/grocery';
import { GroceryItemRow } from './GroceryItemRow';
import styles from './CategoryGroup.module.css';

type CategoryGroupProps = {
  category: string;
  items: GroceryItem[];
  onToggle: (id: string, completed: boolean) => void;
};

export function CategoryGroup({ category, items, onToggle }: CategoryGroupProps) {
  const { t } = useLocale();
  const label = CATEGORY_KEYS[category] ? t(CATEGORY_KEYS[category]) : category;
  return (
    <section className={styles.group}>
      <h2 className={styles.heading}>
        {label} {categoryEmojis[category] ?? '🛒'}
      </h2>
      <ul className={styles.items}>
        {items.map((item) => (
          <GroceryItemRow key={item.id} item={item} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  );
}
