'use client';

import { groupByCategory } from '../../utils/groupByCategory';
import { useGroceries } from '../../hooks/useGroceries';
import { groceryService as defaultService } from '../../services/dataClient';
import type { GroceryErrorCode, GroceryService } from '../../services/groceryService';
import { CategoryGroup } from './CategoryGroup';
import { GroceryInput } from './GroceryInput';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './GroceryList.module.css';

const ERROR_KEYS: Record<GroceryErrorCode, MessageKey> = {
  'invalid-name': 'grocery.error.invalidName',
  'not-found': 'grocery.error.notFound',
  unknown: 'error.unknown',
};

type GroceryListProps = {
  householdId: string;
  uid: string;
  service?: GroceryService;
};

export function GroceryList({ householdId, uid, service = defaultService }: GroceryListProps) {
  const { items, error, addItem, setCompleted, clearCompleted } = useGroceries(householdId, uid, service);
  const { t } = useLocale();

  if (items === null) {
    return (
      <p role="status" className={styles.status}>
        {t('grocery.loading')}
      </p>
    );
  }

  const hasCompleted = items.some((item) => item.completed);

  return (
    <section className={styles.list}>
      <h2 className={styles.title}>{t('grocery.title')}</h2>

      <GroceryInput onAdd={addItem} />

      {error && (
        <p role="alert" className={styles.error}>
          {t(ERROR_KEYS[error])}
        </p>
      )}

      {items.length === 0 && <p className={styles.status}>{t('grocery.empty')}</p>}

      <div className={styles.groups}>
        {groupByCategory(items).map((group) => (
          <CategoryGroup
            key={group.category}
            category={group.category}
            items={group.items}
            onToggle={setCompleted}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.complete} onClick={clearCompleted} disabled={!hasCompleted}>
          {t('grocery.completed')}
        </button>
      </div>
    </section>
  );
}
