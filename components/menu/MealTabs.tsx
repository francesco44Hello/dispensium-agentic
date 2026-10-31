import type { MealType } from '../../types/menu';
import styles from './MealTabs.module.css';
import { useLocale } from '../i18n/LocaleProvider';
import { MEAL_KEYS } from '../../i18n/messages';
import { AppIcon } from '../icons/AppIcon';

interface Props {
  selected: MealType;
  onSelect: (meal: MealType) => void;
}

export function MealTabs({ selected, onSelect }: Props) {
  const { t } = useLocale();
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        aria-pressed={selected === 'breakfast'}
        aria-label={t(MEAL_KEYS.breakfast)}
        className={`${styles.tab} ${selected === 'breakfast' ? styles.active : ''}`}
        onClick={() => onSelect('breakfast')}
      >
        <span>{t(MEAL_KEYS.breakfast)}</span>
        <AppIcon name="meal-breakfast" className={styles.icon} />
      </button>
      <button
        type="button"
        aria-pressed={selected === 'lunch'}
        aria-label={t(MEAL_KEYS.lunch)}
        className={`${styles.tab} ${selected === 'lunch' ? styles.active : ''}`}
        onClick={() => onSelect('lunch')}
      >
        <span>{t(MEAL_KEYS.lunch)}</span>
        <AppIcon name="meal-lunch" className={styles.icon} />
      </button>
      <button
        type="button"
        aria-pressed={selected === 'dinner'}
        aria-label={t(MEAL_KEYS.dinner)}
        className={`${styles.tab} ${selected === 'dinner' ? styles.active : ''}`}
        onClick={() => onSelect('dinner')}
      >
        <span>{t(MEAL_KEYS.dinner)}</span>
        <AppIcon name="meal-dinner" className={styles.icon} />
      </button>
    </div>
  );
}
