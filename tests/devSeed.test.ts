import { describe, it, expect } from 'vitest';
import { withDevSeed, type SeedFile } from '../services/dataBackends/devSeed';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import type { Recipe } from '../types/recipe';

const HID = 'hh-1';
const seed: SeedFile = {
  recipes: [
    {
      title: 'Zuppa di zucca e lenticchie',
      time: '',
      category: 'Dinner',
      label: 'Cozy Winter ❄️',
      ingredients: ['zucca', 'lenticchie'],
      steps: ['Cuocere'],
      photoBase64: Buffer.from([1, 2, 3]).toString('base64'),
      photoType: 'image/webp',
    },
  ],
};

function listOf(recipes: ReturnType<typeof createMemoryDataBackend>['recipes']): Recipe[] {
  let value: Recipe[] = [];
  recipes.subscribeToRecipes(HID, (next) => {
    value = next;
  })();
  return value;
}

const flush = () => new Promise((done) => setTimeout(done, 0));

describe('withDevSeed', () => {
  it('adds the seeded recipe, with its photo, once per household', async () => {
    const backend = createMemoryDataBackend().recipes;
    const seeded = withDevSeed(backend, async () => seed);
    seeded.subscribeToRecipes(HID, () => undefined)();
    await flush();
    seeded.subscribeToRecipes(HID, () => undefined)();
    await flush();
    const recipes = listOf(backend);
    expect(recipes.map((r) => r.title)).toEqual(['Zuppa di zucca e lenticchie']);
    expect(recipes[0].image).toMatch(/^households\/hh-1\/recipes\/.+\.webp$/);
  });

  it('does nothing when there is no seed file', async () => {
    const backend = createMemoryDataBackend().recipes;
    const seeded = withDevSeed(backend, async () => null);
    seeded.subscribeToRecipes(HID, () => undefined)();
    await flush();
    expect(listOf(backend)).toEqual([]);
  });
});
