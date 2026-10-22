'use client';

import { groupByCategory } from '../../utils/groupByCategory';
import { useGroceries } from '../../hooks/useGroceries';
import { groceryService as defaultService } from '../../services/dataClient';
import type { GroceryErrorCode, GroceryService } from '../../services/groceryService';
import { CategoryGroup } from './CategoryGroup';
import { GroceryInput } from './GroceryInput';
import styles from './GroceryList.module.css';

const ERROR_MESSAGES: Record<GroceryErrorCode, string> = {
  'invalid-name': 'Please enter a valid item name (1–100 characters, without < > { } ").',
  'not-found': 'That item no longer exists.',
  unknown: 'Something went wrong. Please try again.',
};

type GroceryListProps = {
  householdId: string;
  uid: string;
  service?: GroceryService;
};

export function GroceryList({ householdId, uid, service = defaultService }: GroceryListProps) {
  const { items, error, addItem, setCompleted, clearCompleted } = useGroceries(householdId, uid, service);

  if (items === null) {
    return (
      <p role="status" className={styles.status}>
        Loading list…
      </p>
    );
  }

  const hasCompleted = items.some((item) => item.completed);

  return (
    <section className={styles.list}>
      <h2 className={styles.title}>What&apos;s missing?</h2>

      <GroceryInput onAdd={addItem} />

      {error && (
        <p role="alert" className={styles.error}>
          {ERROR_MESSAGES[error]}
        </p>
      )}

      {items.length === 0 && <p className={styles.status}>Your list is empty.</p>}

      {groupByCategory(items).map((group) => (
        <CategoryGroup
          key={group.category}
          category={group.category}
          items={group.items}
          onToggle={setCompleted}
        />
      ))}

      <div className={styles.footer}>
        <button type="button" className={styles.complete} onClick={clearCompleted} disabled={!hasCompleted}>
          Grocery completed
        </button>
      </div>
    </section>
  );
}
