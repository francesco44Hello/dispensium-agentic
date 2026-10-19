'use client';

import { categoryEmojis } from '../../constants/categories';
import type { GroceryItem } from '../../types/grocery';
import { GroceryItemRow } from './GroceryItemRow';
import styles from './CategoryGroup.module.css';

type CategoryGroupProps = {
  category: string;
  items: GroceryItem[];
  onToggle: (id: string, completed: boolean) => void;
};

export function CategoryGroup({ category, items, onToggle }: CategoryGroupProps) {
  return (
    <section className={styles.group}>
      <h2 className={styles.heading}>
        {category} {categoryEmojis[category] ?? '🛒'}
      </h2>
      <ul className={styles.items}>
        {items.map((item) => (
          <GroceryItemRow key={item.id} item={item} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  );
}
