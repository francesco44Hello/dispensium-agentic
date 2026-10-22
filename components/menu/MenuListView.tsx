import Link from 'next/link';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { dayLabel, toDateId, type PreviousAction } from '../../utils/menuWindow';
import type { Recipe } from '../../types/recipe';
import { MEALS, emptyDay, type DayMenu, type MealEntry, type MealType } from '../../types/menu';
import styles from './MenuListView.module.css';

interface Props {
  days: string[];
  menu: Record<string, DayMenu>;
  recipes: Recipe[];
  previous?: PreviousAction;
  onPrevious?: () => void;
}

const LABELS: Record<MealType, string> = { lunch: 'Lunch', dinner: 'Dinner' };

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

function MealBlock({ label, entry, recipes }: { label: string; entry: MealEntry; recipes: Recipe[] }) {
  return (
    <div className={styles.mealBlock}>
      <h4>{label}</h4>
      {entry.main || entry.side ? (
        <ul className={styles.items}>
          <Item label="Main" text={entry.main} recipeId={entry.mainRecipeId} recipes={recipes} />
          <Item label="Side" text={entry.side} recipeId={entry.sideRecipeId} recipes={recipes} />
        </ul>
      ) : (
        <p className={styles.empty}>Not planned yet</p>
      )}
    </div>
  );
}

// The list view, copied from the legacy weekly menu: one card per day, lunch and dinner under it.
export function MenuListView({ days, menu, recipes, previous, onPrevious }: Props) {
  const todayId = toDateId(new Date());
  return (
    <div className={styles.container}>
      {previous && onPrevious && (
        <button type="button" className={styles.previous} onClick={onPrevious}>
          {previous === 'load' ? <MdChevronLeft aria-hidden="true" /> : <MdChevronRight aria-hidden="true" />}
          {previous === 'load' ? 'Load previous days' : 'Hide previous days'}
        </button>
      )}
      {days.map((date) => {
        const { dayName, dayNumber } = dayLabel(date);
        const day = menu[date];
        const isToday = date === todayId;
        return (
          <section key={date} className={styles.card}>
            <h3 data-today={isToday ? 'true' : 'false'} className={`${styles.header} ${isToday ? styles.today : ''}`}>
              {dayName} {dayNumber}
            </h3>
            <div className={styles.meals}>
              {MEALS.map((meal) => (
                <MealBlock key={meal} label={LABELS[meal]} entry={day?.[meal] ?? emptyDay()[meal]} recipes={recipes} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
