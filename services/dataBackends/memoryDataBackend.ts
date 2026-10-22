import { HouseholdError, type HouseholdBackend } from '../householdService';
import { GroceryError, type GroceryBackend } from '../groceryService';
import { RecipeError, type RecipeBackend } from '../recipeService';
import type { MenuBackend } from '../menuService';
import type { DayMenu, MealEntry, MealType } from '../../types/menu';
import type { Recipe } from '../../types/recipe';
import type { DataBackend } from './dataBackend';
import { addWord, removeWord } from '../../utils/categoryMap';
import { defaultCategoryMap } from '../../constants/categories';
import type { CategoryMap } from '../../types/category';
import type { Household, HouseholdMember, InviteCode } from '../../types/household';
import type { GroceryItem } from '../../types/grocery';
import type { Unsubscribe } from '../../types/subscription';

interface HouseholdRecord {
  household: Household;
  members: Map<string, HouseholdMember>;
}

interface Subscription {
  run: () => void;
}

// In-memory implementation of both backends, used in mock mode and in service tests.
// Every mutation re-runs all subscriptions; listeners fire only when their value changes.
export function createMemoryDataBackend(options: { now?: () => Date } = {}): DataBackend {
  const now = options.now ?? (() => new Date());
  let sequence = 0;
  const nextId = (prefix: string) => `${prefix}-${++sequence}`;

  const households = new Map<string, HouseholdRecord>();
  const activeByUser = new Map<string, string>();
  const invites = new Map<string, InviteCode>();
  const categoryMaps = new Map<string, CategoryMap>();
  const groceries = new Map<string, Map<string, GroceryItem>>();
  const recipes = new Map<string, Map<string, Recipe>>();
  const photos = new Map<string, Blob>();
  const menus = new Map<string, Map<string, Partial<DayMenu>>>();
  const subscriptions = new Set<Subscription>();

  const notifyAll = () => subscriptions.forEach((sub) => sub.run());

  function subscribe<T>(compute: () => T, listener: (value: T) => void): Unsubscribe {
    let last: string | undefined;
    const sub: Subscription = {
      run: () => {
        const next = compute();
        const key = JSON.stringify(next);
        if (key === last) return;
        last = key;
        listener(next);
      },
    };
    subscriptions.add(sub);
    sub.run();
    return () => {
      subscriptions.delete(sub);
    };
  }

  const bucketFor = (householdId: string) => {
    let bucket = groceries.get(householdId);
    if (!bucket) {
      bucket = new Map();
      groceries.set(householdId, bucket);
    }
    return bucket;
  };

  const requireItem = (householdId: string, id: string): GroceryItem => {
    const item = bucketFor(householdId).get(id);
    if (!item) throw new GroceryError('not-found');
    return item;
  };

  const householdBackend: HouseholdBackend = {
    async ensureDefaultHousehold(uid) {
      const existing = activeByUser.get(uid);
      if (existing) return existing;

      const id = nextId('hh');
      const createdAt = now();
      households.set(id, {
        household: { id, name: 'My household', ownerUid: uid, createdAt },
        members: new Map([[uid, { uid, role: 'owner', joinedAt: createdAt }]]),
      });
      categoryMaps.set(id, defaultCategoryMap);
      activeByUser.set(uid, id);
      notifyAll();
      return id;
    },

    async createInvite(householdId, createdBy, invite) {
      if (!households.get(householdId)?.members.has(createdBy)) throw new HouseholdError('not-a-member');
      invites.set(invite.code, invite);
      return invite;
    },

    async joinWithCode(uid, code, at) {
      const invite = invites.get(code);
      if (!invite) throw new HouseholdError('invalid-invite');
      if (invite.expiresAt.getTime() <= at.getTime()) throw new HouseholdError('expired-invite');

      const record = households.get(invite.householdId);
      if (!record) throw new HouseholdError('invalid-invite');
      if (record.members.has(uid)) throw new HouseholdError('already-member');

      record.members.set(uid, { uid, role: 'member', joinedAt: at });
      activeByUser.set(uid, invite.householdId);
      notifyAll();
      return invite.householdId;
    },

    subscribeToActiveHousehold(uid, listener) {
      return subscribe(() => activeByUser.get(uid) ?? null, listener);
    },

    subscribeToMembers(householdId, listener) {
      return subscribe(() => {
        const members = households.get(householdId)?.members.values();
        return members ? [...members].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()) : [];
      }, listener);
    },
  };

  const groceryBackend: GroceryBackend = {
    async getCategoryMap(householdId) {
      return categoryMaps.get(householdId) ?? null;
    },

    async addItem(householdId, item) {
      const id = nextId('gi');
      bucketFor(householdId).set(id, { id, ...item, completed: false, createdAt: now() });
      notifyAll();
      return id;
    },

    async renameItem(householdId, id, name, category) {
      const item = requireItem(householdId, id);
      bucketFor(householdId).set(id, { ...item, name, category });
      notifyAll();
    },

    async setCompleted(householdId, id, completed) {
      const item = requireItem(householdId, id);
      bucketFor(householdId).set(id, { ...item, completed });
      notifyAll();
    },

    async deleteItem(householdId, id) {
      requireItem(householdId, id);
      bucketFor(householdId).delete(id);
      notifyAll();
    },

    async deleteCompleted(householdId) {
      const bucket = bucketFor(householdId);
      for (const item of [...bucket.values()]) {
        if (item.completed) bucket.delete(item.id);
      }
      notifyAll();
    },

    subscribeToGroceries(householdId, listener) {
      return subscribe(
        () => [...bucketFor(householdId).values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        listener,
      );
    },

    async addCategoryWord(householdId, category, word) {
      const current = categoryMaps.get(householdId) ?? defaultCategoryMap;
      if (!Object.hasOwn(current, category)) throw new GroceryError('unknown-category');
      categoryMaps.set(householdId, addWord(current, category, word));
      notifyAll();
    },

    async removeCategoryWord(householdId, category, word) {
      const current = categoryMaps.get(householdId) ?? defaultCategoryMap;
      if (!Object.hasOwn(current, category)) throw new GroceryError('unknown-category');
      categoryMaps.set(householdId, removeWord(current, category, word));
      notifyAll();
    },

    subscribeToCategoryMap(householdId, listener) {
      return subscribe(() => categoryMaps.get(householdId) ?? defaultCategoryMap, listener);
    },
  };

  const recipeBackend: RecipeBackend = {
    // In mock mode photos stay in memory, and display URLs are object URLs, so nothing is sent anywhere.
    async uploadPhoto(householdId, photo) {
      const path = `households/${householdId}/recipes/${nextId('ph')}.webp`;
      photos.set(path, photo);
      return path;
    },

    async deletePhoto(path) {
      photos.delete(path);
    },

    async photoUrl(path) {
      const photo = photos.get(path);
      if (!photo) throw new RecipeError('invalid-photo');
      return URL.createObjectURL(photo);
    },

    async addRecipe(householdId, recipe) {
      const id = nextId('rc');
      let bucket = recipes.get(householdId);
      if (!bucket) {
        bucket = new Map();
        recipes.set(householdId, bucket);
      }
      bucket.set(id, { id, ...recipe, createdAt: now() });
      notifyAll();
      return id;
    },

    subscribeToRecipes(householdId, listener) {
      return subscribe(
        // Insertion order is chronological, so reversing gives newest first even when timestamps tie.
        () => [...(recipes.get(householdId)?.values() ?? [])].reverse(),
        listener,
      );
    },
  };

  const menuBackend: MenuBackend = {
    async setMeal(householdId, date, meal: MealType, entry: MealEntry) {
      let days = menus.get(householdId);
      if (!days) {
        days = new Map();
        menus.set(householdId, days);
      }
      days.set(date, { ...days.get(date), [meal]: entry });
      notifyAll();
    },

    subscribeToMenu(householdId, dates, listener) {
      return subscribe(() => {
        const days = menus.get(householdId);
        const picked: Record<string, Partial<DayMenu>> = {};
        for (const date of dates) {
          const day = days?.get(date);
          if (day) picked[date] = day;
        }
        return picked;
      }, listener);
    },
  };

  return { households: householdBackend, groceries: groceryBackend, recipes: recipeBackend, menu: menuBackend };
}
