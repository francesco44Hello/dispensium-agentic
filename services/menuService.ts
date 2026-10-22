import { sanitizeInput } from '../utils/sanitizeInput';
import { emptyDay, isMealType, type DayMenu, type MealEntry, type MealType } from '../types/menu';
import type { Unsubscribe } from '../types/subscription';

export type MenuErrorCode = 'invalid-date' | 'invalid-meal' | 'invalid-text' | 'invalid-recipe';

export class MenuError extends Error {
  code: MenuErrorCode;

  constructor(code: MenuErrorCode) {
    super(code);
    this.name = 'MenuError';
    this.code = code;
  }
}

export interface MenuBackend {
  setMeal(householdId: string, date: string, meal: MealType, entry: MealEntry): Promise<void>;
  // Days that were never saved may be missing or partial; the service fills them in.
  // Only the requested days are listened to, so the listener stays small however long the household plans.
  subscribeToMenu(householdId: string, dates: string[], listener: (menu: Record<string, Partial<DayMenu>>) => void): Unsubscribe;
}

const DATE_ID = /^\d{4}-\d{2}-\d{2}$/;
// The screen shows 14 days; the cap keeps any caller within Firestore's 'in' query limit.
const MAX_WINDOW_DAYS = 30;
const RECIPE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_TEXT = 100;

// sanitizeInput strips blocked characters but does not trim, so both steps are needed.
function cleanText(raw: string): string {
  const value = sanitizeInput(raw).trim();
  if (value.length > MAX_TEXT) throw new MenuError('invalid-text');
  return value;
}

// A recipe link is only kept when there is text to show, and it must look like an id.
function cleanRecipeId(raw: string, text: string): string {
  if (!text || raw === '') return '';
  if (!RECIPE_ID.test(raw)) throw new MenuError('invalid-recipe');
  return raw;
}

function cleanEntry(entry: MealEntry): MealEntry {
  const main = cleanText(entry.main);
  const side = cleanText(entry.side);
  return {
    main,
    side,
    mainRecipeId: cleanRecipeId(entry.mainRecipeId, main),
    sideRecipeId: cleanRecipeId(entry.sideRecipeId, side),
  };
}

// A day id must be a real calendar day: 2026-02-31 and 2027-02-29 are rejected, not rolled over.
function isRealDate(id: string): boolean {
  if (!DATE_ID.test(id)) return false;
  const [year, month, day] = id.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function normalizeDay(raw: Partial<DayMenu> | undefined): DayMenu {
  const day = emptyDay();
  return { lunch: raw?.lunch ?? day.lunch, dinner: raw?.dinner ?? day.dinner };
}

export function createMenuService(backend: MenuBackend) {
  return {
    async setMeal(householdId: string, date: string, meal: MealType, entry: MealEntry): Promise<void> {
      if (!isRealDate(date)) throw new MenuError('invalid-date');
      if (!isMealType(meal)) throw new MenuError('invalid-meal');
      await backend.setMeal(householdId, date, meal, cleanEntry(entry));
    },

    subscribeToMenu(householdId: string, dates: string[], listener: (menu: Record<string, DayMenu>) => void): Unsubscribe {
      const wanted = dates.filter(isRealDate).slice(0, MAX_WINDOW_DAYS);
      return backend.subscribeToMenu(householdId, wanted, (raw) => {
        const menu: Record<string, DayMenu> = {};
        for (const date of wanted) menu[date] = normalizeDay(raw[date]);
        listener(menu);
      });
    },
  };
}
