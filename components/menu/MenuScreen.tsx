'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FiCalendar, FiList } from 'react-icons/fi';
import { AppShell } from '../AppShell';
import { useHousehold } from '../../hooks/useHousehold';
import { menuService, recipeService } from '../../services/dataClient';
import { PREVIOUS_STEP_DAYS, listDays, menuWindow, previousAction, toDateId } from '../../utils/menuWindow';
import { emptyDay, type DayMenu, type MealEntry, type MealType } from '../../types/menu';
import type { Recipe } from '../../types/recipe';
import { CalendarBar } from './CalendarBar';
import { MealDisplay } from './MealDisplay';
import { MealEditForm } from './MealEditForm';
import { MealTabs } from './MealTabs';
import { MenuListView } from './MenuListView';
import styles from './MenuScreen.module.css';

type View = 'calendar' | 'list';


export function MenuScreen() {
  const { status, householdId, error } = useHousehold();
  const [today] = useState(() => new Date());
  // Earlier days start hidden, so both views open on today. The same setting drives both views.
  const [daysBack, setDaysBack] = useState(0);
  const days = useMemo(() => menuWindow(today, daysBack), [today, daysBack]);
  const dayList = useMemo(() => listDays(today, daysBack), [today, daysBack]);
  const previous = previousAction(daysBack);
  const togglePrevious = () => setDaysBack((back) => (previous === 'hide' ? 0 : back + PREVIOUS_STEP_DAYS));
  const [selectedDate, setSelectedDate] = useState(toDateId(today));
  const [meal, setMeal] = useState<MealType>('lunch');
  const [view, setView] = useState<View>('calendar');
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState<Record<string, DayMenu>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!householdId) return;
    const stopMenu = menuService.subscribeToMenu(householdId, days, setMenu);
    const stopRecipes = recipeService.subscribeToRecipes(householdId, setRecipes);
    return () => {
      stopMenu();
      stopRecipes();
    };
  }, [householdId, days]);

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setEditing(false);
  };

  const selectMeal = (next: MealType) => {
    setMeal(next);
    setEditing(false);
  };

  const save = async (entry: MealEntry) => {
    if (!householdId) return;
    setSaveError('');
    try {
      await menuService.setMeal(householdId, selectedDate, meal, entry);
      setEditing(false);
    } catch {
      setSaveError('Could not save the meal. Check the text and try again.');
    }
  };

  const day: DayMenu = menu[selectedDate] ?? emptyDay();
  const ready = status === 'ready' && householdId;

  let body: ReactNode;
  if (status === 'error') {
    body = <p role="alert">We could not load your household ({error ?? 'unknown error'}). Please refresh the page.</p>;
  } else if (!ready) {
    body = <p role="status" className={styles.loading}>Loading menu…</p>;
  } else if (view === 'list') {
    body = <MenuListView days={dayList} menu={menu} recipes={recipes} previous={previous} onPrevious={togglePrevious} />;
  } else {
    body = (
      <>
        <CalendarBar
          days={days}
          selected={selectedDate}
          onSelect={selectDate}
          previous={previous}
          onPrevious={togglePrevious}
        />
        <MealTabs selected={meal} onSelect={selectMeal} />
        <div className={styles.content}>
          {editing ? (
            <MealEditForm
              key={`${selectedDate}-${meal}`}
              entry={day[meal]}
              recipes={recipes}
              onSave={save}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <MealDisplay meal={meal} entry={day[meal]} recipes={recipes} onEdit={() => setEditing(true)} />
          )}
          {saveError && <p role="alert" className={styles.error}>{saveError}</p>}
        </div>
      </>
    );
  }

  return (
    <AppShell flushBottom>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Plan the week</h1>
          <div className={styles.toggle}>
            <button
              type="button"
              aria-label="Calendar view"
              aria-pressed={view === 'calendar'}
              className={`${styles.toggleButton} ${view === 'calendar' ? styles.toggleActive : ''}`}
              onClick={() => setView('calendar')}
            >
              <FiCalendar />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === 'list'}
              className={`${styles.toggleButton} ${view === 'list' ? styles.toggleActive : ''}`}
              onClick={() => setView('list')}
            >
              <FiList />
            </button>
          </div>
        </div>
        {body}
      </div>
    </AppShell>
  );
}
