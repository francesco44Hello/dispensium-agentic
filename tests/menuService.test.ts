import { describe, it, expect } from 'vitest';
import { createMenuService } from '../services/menuService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import type { DayMenu } from '../types/menu';

const HID = 'hh-1';
const DAY = '2026-10-22';

function setup() {
  const backend = createMemoryDataBackend().menu;
  return { backend, service: createMenuService(backend) };
}

const WINDOW = [DAY, '2026-10-23'];

function menuOf(service: ReturnType<typeof setup>['service'], hid = HID): Record<string, DayMenu> {
  let value: Record<string, DayMenu> = {};
  service.subscribeToMenu(hid, WINDOW, (next) => {
    value = next;
  })();
  return value;
}

describe('setMeal', () => {
  it('stores the main and side for a meal and reads them back', async () => {
    const { service } = setup();
    await service.setMeal(HID, DAY, 'lunch', { main: 'Pasta', side: 'Salad', mainRecipeId: 'r1', sideRecipeId: '' });
    expect(menuOf(service)[DAY].lunch).toEqual({ main: 'Pasta', side: 'Salad', mainRecipeId: 'r1', sideRecipeId: '' });
  });

  it('keeps the other meal of the same day', async () => {
    const { service } = setup();
    await service.setMeal(HID, DAY, 'lunch', { main: 'Soup', side: '', mainRecipeId: '', sideRecipeId: '' });
    await service.setMeal(HID, DAY, 'dinner', { main: 'Fish', side: '', mainRecipeId: '', sideRecipeId: '' });
    expect(menuOf(service)[DAY].lunch.main).toBe('Soup');
    expect(menuOf(service)[DAY].dinner.main).toBe('Fish');
  });

  it('trims text and removes blocked characters', async () => {
    const { service } = setup();
    await service.setMeal(HID, DAY, 'dinner', { main: '  <b>Curry</b> ', side: '', mainRecipeId: '', sideRecipeId: '' });
    expect(menuOf(service)[DAY].dinner.main).toBe('bCurry/b');
  });

  it('clears a meal when both texts are empty', async () => {
    const { service } = setup();
    await service.setMeal(HID, DAY, 'lunch', { main: 'Soup', side: '', mainRecipeId: 'r1', sideRecipeId: '' });
    await service.setMeal(HID, DAY, 'lunch', { main: '', side: '', mainRecipeId: '', sideRecipeId: '' });
    expect(menuOf(service)[DAY].lunch.main).toBe('');
    expect(menuOf(service)[DAY].lunch.mainRecipeId).toBe('');
  });

  it('rejects a date that is not YYYY-MM-DD', async () => {
    const { service } = setup();
    await expect(service.setMeal(HID, '22/10/2026', 'lunch', { main: 'x', side: '', mainRecipeId: '', sideRecipeId: '' }))
      .rejects.toMatchObject({ code: 'invalid-date' });
  });

  it('rejects a meal that is not breakfast, lunch or dinner', async () => {
    const { service } = setup();
    await expect(service.setMeal(HID, DAY, 'brunch' as 'lunch', { main: 'x', side: '', mainRecipeId: '', sideRecipeId: '' }))
      .rejects.toMatchObject({ code: 'invalid-meal' });
  });

  it('rejects text longer than 100 characters', async () => {
    const { service } = setup();
    await expect(service.setMeal(HID, DAY, 'lunch', { main: 'x'.repeat(101), side: '', mainRecipeId: '', sideRecipeId: '' }))
      .rejects.toMatchObject({ code: 'invalid-text' });
  });

  it('rejects a day that does not exist in the calendar', async () => {
    const { service } = setup();
    await expect(service.setMeal(HID, '2026-02-31', 'lunch', { main: 'x', side: '', mainRecipeId: '', sideRecipeId: '' }))
      .rejects.toMatchObject({ code: 'invalid-date' });
    await expect(service.setMeal(HID, '2026-04-31', 'lunch', { main: 'x', side: '', mainRecipeId: '', sideRecipeId: '' }))
      .rejects.toMatchObject({ code: 'invalid-date' });
  });

  it('rejects a recipe id that is not a plain id', async () => {
    const { service } = setup();
    await expect(service.setMeal(HID, DAY, 'lunch', { main: 'x', side: '', mainRecipeId: '../secrets', sideRecipeId: '' }))
      .rejects.toMatchObject({ code: 'invalid-recipe' });
  });

  it('keeps each household menu separate', async () => {
    const { service } = setup();
    await service.setMeal('hh-2', DAY, 'lunch', { main: 'Other', side: '', mainRecipeId: '', sideRecipeId: '' });
    // Household hh-1 sees its own empty days, never hh-2's meal.
    expect(menuOf(service, HID)[DAY].lunch.main).toBe('');
  });
});

describe('subscribeToMenu', () => {
  it('fills in a meal that was never saved as an empty entry', async () => {
    const { service } = setup();
    await service.setMeal(HID, DAY, 'lunch', { main: 'Soup', side: '', mainRecipeId: '', sideRecipeId: '' });
    let seen: Record<string, DayMenu> = {};
    service.subscribeToMenu(HID, [DAY], (menu) => {
      seen = menu;
    })();
    expect(seen[DAY].dinner).toEqual({ main: '', side: '', mainRecipeId: '', sideRecipeId: '' });
    expect(menuOf(service)[DAY].lunch.main).toBe('Soup');
  });

  it('listens only to the days asked for, so the listener stays small', async () => {
    const { service } = setup();
    await service.setMeal(HID, DAY, 'lunch', { main: 'Soup', side: '', mainRecipeId: '', sideRecipeId: '' });
    await service.setMeal(HID, '2020-01-01', 'lunch', { main: 'Old', side: '', mainRecipeId: '', sideRecipeId: '' });
    let seen: Record<string, DayMenu> = {};
    service.subscribeToMenu(HID, [DAY], (menu) => {
      seen = menu;
    })();
    expect(Object.keys(seen)).toEqual([DAY]);
  });
});
