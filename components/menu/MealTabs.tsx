import type { MealType } from '../../types/menu';
import styles from './MealTabs.module.css';
import { useLocale } from '../i18n/LocaleProvider';
import { MEAL_KEYS } from '../../i18n/messages';

interface Props {
  selected: MealType;
  onSelect: (meal: MealType) => void;
}

// The lunch and dinner icons are the same SVGs the legacy app uses.
export function MealTabs({ selected, onSelect }: Props) {
  const { t } = useLocale();
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        aria-pressed={selected === 'lunch'}
        aria-label={t(MEAL_KEYS.lunch)}
        className={`${styles.tab} ${selected === 'lunch' ? styles.active : ''}`}
        onClick={() => onSelect('lunch')}
      >
        <span>{t(MEAL_KEYS.lunch)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
          <path d="M0 0h24v24H0z" fill="none" />
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
            <path d="M17.031.75c1.437 2.873-2.9 3.881-.75 6.75M12.531.75c1.437 2.873-2.9 3.881-.75 6.75M8.031.75c1.437 2.873-2.9 3.881-.75 6.75M.75 12.75c0 .796 1.185 1.559 3.295 2.121s4.971.879 7.955.879s5.845-.316 7.955-.879s3.295-1.325 3.295-2.121s-1.185-1.559-3.295-2.121S14.984 9.75 12 9.75s-5.845.316-7.955.879S.75 11.954.75 12.75" />
            <path d="M23.25 12.75c0 5.8-5.037 10.5-11.25 10.5S.75 18.549.75 12.75" />
          </g>
        </svg>
      </button>
      <button
        type="button"
        aria-pressed={selected === 'dinner'}
        aria-label={t(MEAL_KEYS.dinner)}
        className={`${styles.tab} ${selected === 'dinner' ? styles.active : ''}`}
        onClick={() => onSelect('dinner')}
      >
        <span>{t(MEAL_KEYS.dinner)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 15 15" className={styles.icon} aria-hidden="true">
          <path d="M0 0h15v15H0z" fill="none" />
          <path fill="currentColor" d="m14.1 1.24l.4.58c.64.94.67 2.1.06 3.06c-.94 1.49-1.51 2.7-1.69 3.62c-.14.74-.24 1.51-.3 2.33c-.08 1.05-.78 2.010-1.87 2.54l-2.27 1.1c-2.25 1.09-5.13.44-6.43-1.45L.92 11.45c-1.9-2.77-.77-6.3 2.51-7.89L10.08.33c1.4-.68 3.2-.28 4.02.91m-1.03.71c-.46-.66-1.58-.92-2.45-.49L3.98 4.68C1.36 5.95.51 8.63 1.95 10.74l1.08 1.57c.94 1.37 3.14 1.87 4.85 1.03l2.27-1.1c.71-.34 1.13-.91 1.17-1.5c.06-.87.17-1.7.33-2.48c.21-1.1.84-2.44 1.85-4.05c.34-.54.33-1.15-.03-1.68zm-1.03.7l.4.59c.08.12.08.19.01.3c-1.1 1.73-1.78 3.19-2.03 4.48c-.17.83-.28 1.71-.35 2.63c-.01.13-.15.31-.46.47l-2.27 1.1c-1.17.57-2.7.23-3.28-.61l-1.08-1.58c-.99-1.45-.41-3.27 1.55-4.22l6.64-3.23c.33-.16.78-.06.87.07M5.75 7.86a1.006 1.006 0 0 0-.4 1.5s0 .01.01.02c.39.53 1.14.64 1.67.25l.6-.45c.48-.35.74-.92.7-1.51a.8.8 0 0 0-.06-.22a.665.665 0 0 0-.89-.33z" />
        </svg>
      </button>
    </div>
  );
}
