import Link from 'next/link';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { dayLabel, toDateId, type PreviousAction } from '../../utils/menuWindow';
import type { Recipe } from '../../types/recipe';
import { MEALS, emptyDay, type DayMenu, type MealEntry } from '../../types/menu';
import styles from './MenuListView.module.css';
import { useLocale } from '../i18n/LocaleProvider';
import { INTL_LOCALE } from '../../i18n/locale';
import { MEAL_KEYS } from '../../i18n/messages';

interface Props {
  days: string[];
  menu: Record<string, DayMenu>;
  recipes: Recipe[];
  previous?: PreviousAction;
  onPrevious?: () => void;
}


// One item of a meal: a recipe link when the entry has a recipe, plain text otherwise.
function Item({ label, text, recipeId, recipes }: { label: string; text: string; recipeId: string; recipes: Recipe[] }) {
  if (!text) return null;
  const recipe = recipes.find((candidate) => candidate.id === recipeId);
  return (
    <li>
      <span className={styles.itemLabel}>{label}:</span>{' '}
      {recipe ? <Link href={`/recipes/${recipe.id}`} className={styles.link}>{text}</Link> : text}
    </li>
  );
}

function MealBlock({ label, entry, recipes, desktopOnly }: { label: string; entry: MealEntry; recipes: Recipe[]; desktopOnly: boolean }) {
  const { t } = useLocale();
  return (
    <div className={`${styles.mealBlock} ${desktopOnly ? styles.desktopOnly : ''}`}>
      <h4>{label}</h4>
      {entry.main || entry.side ? (
        <ul className={styles.items}>
          <Item label={t('menu.main')} text={entry.main} recipeId={entry.mainRecipeId} recipes={recipes} />
          <Item label={t('menu.side')} text={entry.side} recipeId={entry.sideRecipeId} recipes={recipes} />
        </ul>
      ) : (
        <p className={styles.empty}>{t('menu.notPlanned')}</p>
      )}
    </div>
  );
}

// The list view, copied from the legacy weekly menu: one card per day, lunch and dinner under it.
export function MenuListView({ days, menu, recipes, previous, onPrevious }: Props) {
  const { t, locale } = useLocale();
  const todayId = toDateId(new Date());
  return (
    <div className={styles.container}>
      {previous && onPrevious && (
        <button type="button" className={styles.previous} onClick={onPrevious}>
          {previous === 'load' ? <MdChevronLeft aria-hidden="true" /> : <MdChevronRight aria-hidden="true" />}
          {previous === 'load' ? t('menu.loadPrevious') : t('menu.hidePrevious')}
        </button>
      )}
      {days.map((date) => {
        const { dayName, dayNumber } = dayLabel(date, INTL_LOCALE[locale]);
        const day = menu[date];
        const isToday = date === todayId;
        return (
          <section key={date} className={styles.card}>
            <h3 data-today={isToday ? 'true' : 'false'} className={`${styles.header} ${isToday ? styles.today : ''}`}>
              {dayName} {dayNumber}
            </h3>
            <div className={styles.meals}>
              {MEALS.map((meal) => (
                <MealBlock
                  key={meal}
                  label={t(MEAL_KEYS[meal])}
                  entry={day?.[meal] ?? emptyDay()[meal]}
                  recipes={recipes}
                  desktopOnly={meal === 'breakfast'}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
