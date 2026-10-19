import { describe, it, expect } from 'vitest';
import { createGroceryService, GroceryError } from '../services/groceryService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import { defaultCategoryMap } from '../constants/categories';
import type { CategoryMap } from '../types/category';
import type { GroceryItem } from '../types/grocery';

const HID = 'hh-1';

function setup() {
  const backend = createMemoryDataBackend().groceries;
  return { backend, service: createGroceryService(backend) };
}

function current<T>(subscribe: (listener: (value: T) => void) => () => void): T {
  let value!: T;
  const off = subscribe((next) => {
    value = next;
  });
  off();
  return value;
}

const itemsOf = (backend: ReturnType<typeof setup>['backend'], hid = HID) =>
  current<GroceryItem[]>((l) => backend.subscribeToGroceries(hid, l));

const mapOf = (backend: ReturnType<typeof setup>['backend'], hid = HID) =>
  current<CategoryMap>((l) => backend.subscribeToCategoryMap(hid, l));

describe('addItem', () => {
  it('stores the sanitised, trimmed name categorised with the default map', async () => {
    const { service, backend } = setup();
    await service.addItem(HID, 'alice', '  Whole <Milk> ');
    const [item] = itemsOf(backend);
    expect(item).toMatchObject({ name: 'Whole Milk', category: 'dairy', completed: false, createdBy: 'alice' });
  });

  it('rejects blank input, or input that is only blocked characters', async () => {
    const { service } = setup();
    await expect(service.addItem(HID, 'alice', '   ')).rejects.toMatchObject({ code: 'invalid-name' });
    await expect(service.addItem(HID, 'alice', '<>{}"')).rejects.toMatchObject({ code: 'invalid-name' });
  });

  it('rejects names longer than 100 characters', async () => {
    const { service } = setup();
    await expect(service.addItem(HID, 'alice', 'a'.repeat(101))).rejects.toMatchObject({ code: 'invalid-name' });
  });

  it('uses the household custom category map', async () => {
    const { service, backend } = setup();
    await service.addItem(HID, 'alice', 'dragonfruit');
    expect(itemsOf(backend).at(-1)?.category).toBe('other');

    await service.addWordToCategory(HID, 'fruits', 'Dragonfruit');
    await service.addItem(HID, 'alice', 'dragonfruit');
    expect(itemsOf(backend).at(-1)?.category).toBe('fruits');
  });
});

describe('renameItem', () => {
  it('renames the item and recategorises it', async () => {
    const { service, backend } = setup();
    const id = await service.addItem(HID, 'alice', 'bread');
    await service.renameItem(HID, id, 'milk');
    expect(itemsOf(backend)[0]).toMatchObject({ id, name: 'milk', category: 'dairy' });
  });

  it('rejects an unknown item with not-found', async () => {
    const { service } = setup();
    await expect(service.renameItem(HID, 'missing', 'milk')).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('setCompleted', () => {
  it('sets the completed flag to the explicit value, idempotently', async () => {
    const { service, backend } = setup();
    const id = await service.addItem(HID, 'alice', 'apple');
    await service.setCompleted(HID, id, true);
    await service.setCompleted(HID, id, true);
    expect(itemsOf(backend)[0].completed).toBe(true);
    await service.setCompleted(HID, id, false);
    expect(itemsOf(backend)[0].completed).toBe(false);
  });

  it('rejects an unknown item with not-found', async () => {
    const { service } = setup();
    await expect(service.setCompleted(HID, 'missing', true)).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('deleteItem and clearCompleted', () => {
  it('deletes a single item', async () => {
    const { service, backend } = setup();
    const id = await service.addItem(HID, 'alice', 'apple');
    await service.deleteItem(HID, id);
    expect(itemsOf(backend)).toEqual([]);
  });

  it('clears only completed items', async () => {
    const { service, backend } = setup();
    const a = await service.addItem(HID, 'alice', 'apple');
    const b = await service.addItem(HID, 'alice', 'bread');
    await service.addItem(HID, 'alice', 'milk');
    await service.setCompleted(HID, a, true);
    await service.setCompleted(HID, b, true);

    await service.clearCompleted(HID);

    expect(itemsOf(backend).map((i) => i.name)).toEqual(['milk']);
  });
});

describe('subscribeToGroceries', () => {
  it('emits items in creation order', async () => {
    const { service, backend } = setup();
    await service.addItem(HID, 'alice', 'bread');
    await service.addItem(HID, 'alice', 'apple');
    expect(itemsOf(backend).map((i) => i.name)).toEqual(['bread', 'apple']);
  });

  it('stops emitting after unsubscribe', async () => {
    const { service, backend } = setup();
    let calls = 0;
    const off = backend.subscribeToGroceries(HID, () => {
      calls++;
    });
    off();
    const before = calls;
    await service.addItem(HID, 'alice', 'apple');
    expect(calls).toBe(before);
  });

  it('keeps households isolated from one another', async () => {
    const { service, backend } = setup();
    await service.addItem(HID, 'alice', 'apple');
    expect(itemsOf(backend, 'hh-2')).toEqual([]);
  });
});

describe('category map', () => {
  it('emits the default map when none is stored', () => {
    const { backend } = setup();
    expect(mapOf(backend)).toEqual(defaultCategoryMap);
  });

  it('adds a sanitised, lowercased word and notifies subscribers', async () => {
    const { service, backend } = setup();
    await service.addWordToCategory(HID, 'fruits', '  <Dragonfruit> ');
    expect(mapOf(backend).fruits).toContain('dragonfruit');
  });

  it('ignores a word that is already in the category', async () => {
    const { service, backend } = setup();
    await service.addWordToCategory(HID, 'fruits', 'apple');
    expect(mapOf(backend).fruits.filter((w) => w === 'apple')).toHaveLength(1);
  });

  it('rejects a blank word with invalid-word', async () => {
    const { service } = setup();
    await expect(service.addWordToCategory(HID, 'fruits', '   ')).rejects.toMatchObject({ code: 'invalid-word' });
  });

  it('rejects an unknown category with unknown-category', async () => {
    const { service } = setup();
    await expect(service.addWordToCategory(HID, 'gadgets', 'phone')).rejects.toMatchObject({
      code: 'unknown-category',
    });
  });

  it('removes a word from the category', async () => {
    const { service, backend } = setup();
    await service.addWordToCategory(HID, 'fruits', 'dragonfruit');
    await service.removeWordFromCategory(HID, 'fruits', 'dragonfruit');
    expect(mapOf(backend).fruits).not.toContain('dragonfruit');
  });

  it('throws GroceryError instances', async () => {
    const { service } = setup();
    await expect(service.addItem(HID, 'alice', '')).rejects.toBeInstanceOf(GroceryError);
  });
});
