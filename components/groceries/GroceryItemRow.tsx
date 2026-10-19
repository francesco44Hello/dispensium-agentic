'use client';

import type { GroceryItem } from '../../types/grocery';
import styles from './GroceryItemRow.module.css';

type GroceryItemRowProps = {
  item: GroceryItem;
  onToggle: (id: string, completed: boolean) => void;
};

export function GroceryItemRow({ item, onToggle }: GroceryItemRowProps) {
  return (
    <li className={styles.row}>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggle(item.id, !item.completed)}
        />
        <span className={item.completed ? styles.done : undefined}>{item.name}</span>
      </label>
    </li>
  );
}
