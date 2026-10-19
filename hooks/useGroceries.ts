'use client';

import { useCallback, useEffect, useState } from 'react';
import { defaultCategoryMap } from '../constants/categories';
import { GroceryError, type GroceryErrorCode, type GroceryService } from '../services/groceryService';
import type { CategoryMap } from '../types/category';
import type { GroceryItem } from '../types/grocery';

type Snapshot = {
  householdId: string;
  items: GroceryItem[];
  categoryMap: CategoryMap;
};

// Subscriptions are keyed by household, so a switch never shows the previous household's items.
export function useGroceries(householdId: string, uid: string, service: GroceryService) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<GroceryErrorCode | null>(null);

  useEffect(() => {
    const offItems = service.subscribeToGroceries(householdId, (items) =>
      setSnapshot((prev) => ({
        householdId,
        items,
        categoryMap: prev?.householdId === householdId ? prev.categoryMap : defaultCategoryMap,
      })),
    );
    const offMap = service.subscribeToCategoryMap(householdId, (categoryMap) =>
      setSnapshot((prev) => ({
        householdId,
        items: prev?.householdId === householdId ? prev.items : [],
        categoryMap,
      })),
    );
    return () => {
      offItems();
      offMap();
    };
  }, [householdId, service]);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof GroceryError ? err.code : 'unknown');
    }
  }, []);

  const current = snapshot?.householdId === householdId ? snapshot : null;

  return {
    items: current?.items ?? null,
    categoryMap: current?.categoryMap ?? null,
    error,
    addItem: (name: string) => run(() => service.addItem(householdId, uid, name)),
    setCompleted: (id: string, completed: boolean) => run(() => service.setCompleted(householdId, id, completed)),
    clearCompleted: () => run(() => service.clearCompleted(householdId)),
  };
}
