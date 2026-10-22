import { sanitizeInput } from '../utils/sanitizeInput';
import { getCategory } from '../utils/categorize';
import { defaultCategoryMap } from '../constants/categories';
import type { CategoryMap } from '../types/category';
import type { GroceryItem } from '../types/grocery';
import type { Unsubscribe } from '../types/subscription';

export type GroceryErrorCode = 'invalid-name' | 'not-found' | 'unknown';

export class GroceryError extends Error {
  code: GroceryErrorCode;

  constructor(code: GroceryErrorCode) {
    super(code);
    this.name = 'GroceryError';
    this.code = code;
  }
}

interface NewGroceryItem {
  name: string;
  category: string;
  createdBy: string;
}

export interface GroceryBackend {
  getCategoryMap(householdId: string): Promise<CategoryMap | null>;
  addItem(householdId: string, item: NewGroceryItem): Promise<string>;
  renameItem(householdId: string, id: string, name: string, category: string): Promise<void>;
  setCompleted(householdId: string, id: string, completed: boolean): Promise<void>;
  deleteItem(householdId: string, id: string): Promise<void>;
  deleteCompleted(householdId: string): Promise<void>;
  subscribeToGroceries(householdId: string, listener: (items: GroceryItem[]) => void): Unsubscribe;
  subscribeToCategoryMap(householdId: string, listener: (map: CategoryMap) => void): Unsubscribe;
}

const MAX_NAME_LENGTH = 100;

// sanitizeInput strips blocked characters but does not trim, so both steps are needed.
function cleanText(raw: string): string {
  return sanitizeInput(raw).trim();
}

function cleanName(raw: string): string {
  const name = cleanText(raw);
  if (!name || name.length > MAX_NAME_LENGTH) throw new GroceryError('invalid-name');
  return name;
}

export function createGroceryService(backend: GroceryBackend) {
  async function categoryFor(householdId: string, name: string): Promise<string> {
    const map = (await backend.getCategoryMap(householdId)) ?? defaultCategoryMap;
    return getCategory(name, map);
  }

  return {
    async addItem(householdId: string, uid: string, rawName: string): Promise<string> {
      const name = cleanName(rawName);
      const category = await categoryFor(householdId, name);
      return backend.addItem(householdId, { name, category, createdBy: uid });
    },

    async renameItem(householdId: string, id: string, rawName: string): Promise<void> {
      const name = cleanName(rawName);
      const category = await categoryFor(householdId, name);
      return backend.renameItem(householdId, id, name, category);
    },

    setCompleted(householdId: string, id: string, completed: boolean): Promise<void> {
      return backend.setCompleted(householdId, id, completed);
    },

    deleteItem(householdId: string, id: string): Promise<void> {
      return backend.deleteItem(householdId, id);
    },

    clearCompleted(householdId: string): Promise<void> {
      return backend.deleteCompleted(householdId);
    },

    subscribeToGroceries(householdId: string, listener: (items: GroceryItem[]) => void): Unsubscribe {
      return backend.subscribeToGroceries(householdId, listener);
    },

    subscribeToCategoryMap(householdId: string, listener: (map: CategoryMap) => void): Unsubscribe {
      return backend.subscribeToCategoryMap(householdId, listener);
    },
  };
}

export type GroceryService = ReturnType<typeof createGroceryService>;
