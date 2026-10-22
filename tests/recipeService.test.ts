import { describe, it, expect } from 'vitest';
import { createRecipeService, RecipeError } from '../services/recipeService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import { MAX_PHOTO_BYTES } from '../utils/recipeImage';
import type { Recipe, RecipeDraft } from '../types/recipe';

const HID = 'hh-1';
const UID = 'alice';

const draft = (overrides: Partial<RecipeDraft> = {}): RecipeDraft => ({
  title: 'Pasta al pomodoro',
  time: '20 min',
  category: 'Dinner',
  label: 'Quick & Easy ⚡',
  ingredients: ['pasta', 'tomato'],
  steps: ['Boil water', 'Cook sauce'],
  image: '',
  ...overrides,
});

function setup() {
  const backend = createMemoryDataBackend().recipes;
  return { backend, service: createRecipeService(backend) };
}

function recipesOf(backend: ReturnType<typeof setup>['backend'], hid = HID): Recipe[] {
  let value: Recipe[] = [];
  backend.subscribeToRecipes(hid, (next) => {
    value = next;
  })();
  return value;
}

async function expectInvalid(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
  await expect(promise).rejects.toBeInstanceOf(RecipeError);
}

describe('addRecipe', () => {
  it('stores the recipe with the author and returns its id', async () => {
    const { backend, service } = setup();
    const id = await service.addRecipe(HID, UID, draft());
    const [saved] = recipesOf(backend);
    expect(saved.id).toBe(id);
    expect(saved.title).toBe('Pasta al pomodoro');
    expect(saved.createdBy).toBe(UID);
    expect(saved.ingredients).toEqual(['pasta', 'tomato']);
  });

  it('lists the newest recipe first', async () => {
    const { backend, service } = setup();
    await service.addRecipe(HID, UID, draft({ title: 'First' }));
    await service.addRecipe(HID, UID, draft({ title: 'Second' }));
    expect(recipesOf(backend).map((r) => r.title)).toEqual(['Second', 'First']);
  });

  it('removes blocked characters and trims text, including list entries', async () => {
    const { backend, service } = setup();
    await service.addRecipe(HID, UID, draft({
      title: '  <b>Soup</b>  ',
      ingredients: ['  {salt}  ', '   '],
      steps: ['Stir "gently"'],
    }));
    const [saved] = recipesOf(backend);
    expect(saved.title).toBe('bSoup/b');
    expect(saved.ingredients).toEqual(['salt']);
    expect(saved.steps).toEqual(['Stir gently']);
  });

  it('keeps recipes separate per household', async () => {
    const { backend, service } = setup();
    await service.addRecipe('hh-2', UID, draft({ title: 'Other' }));
    expect(recipesOf(backend, HID)).toEqual([]);
  });

  it('rejects an empty or too long title', async () => {
    const { service } = setup();
    await expectInvalid(service.addRecipe(HID, UID, draft({ title: '   ' })), 'invalid-title');
    await expectInvalid(service.addRecipe(HID, UID, draft({ title: 'x'.repeat(101) })), 'invalid-title');
  });

  it('rejects a category or label that is not in the list', async () => {
    const { service } = setup();
    await expectInvalid(service.addRecipe(HID, UID, draft({ category: 'Brunch' })), 'invalid-category');
    await expectInvalid(service.addRecipe(HID, UID, draft({ label: 'Spicy' })), 'invalid-label');
  });

  it('rejects too many or too long ingredients and steps', async () => {
    const { service } = setup();
    const many = Array.from({ length: 51 }, (_, i) => `item ${i}`);
    await expectInvalid(service.addRecipe(HID, UID, draft({ ingredients: many })), 'invalid-ingredients');
    await expectInvalid(service.addRecipe(HID, UID, draft({ ingredients: ['x'.repeat(201)] })), 'invalid-ingredients');
    await expectInvalid(service.addRecipe(HID, UID, draft({ steps: ['x'.repeat(1001)] })), 'invalid-steps');
  });

  it('rejects a time longer than 50 characters', async () => {
    const { service } = setup();
    await expectInvalid(service.addRecipe(HID, UID, draft({ time: 'x'.repeat(51) })), 'invalid-time');
  });

  it('accepts an empty image, and refuses any image link typed or imported from a website', async () => {
    const { service } = setup();
    await expect(service.addRecipe(HID, UID, draft({ image: '' }))).resolves.toBeTruthy();
    await expectInvalid(service.addRecipe(HID, UID, draft({ image: 'https://example.com/a.jpg' })), 'invalid-image');
    await expectInvalid(service.addRecipe(HID, UID, draft({ image: 'javascript:alert(1)' })), 'invalid-image');
  });

  it('stores photos as storage paths, and resolves them to a local URL for display', async () => {
    const { backend, service } = setup();
    await service.addRecipe(HID, UID, draft(), new Blob(['x'], { type: 'image/webp' }));
    const [saved] = recipesOf(backend);
    expect(saved.image.startsWith('https://')).toBe(false);
    expect(await service.photoUrl(saved.image)).toMatch(/^blob:/);
  });

  it('uploads the photo and stores its link on the recipe', async () => {
    const { backend, service } = setup();
    await service.addRecipe(HID, UID, draft(), new Blob(['x'], { type: 'image/webp' }));
    const [saved] = recipesOf(backend);
    expect(saved.image).toMatch(/^households\/hh-1\/recipes\/[^/]+\.webp$/);
  });

  it('rejects a photo that is not an allowed image type', async () => {
    const { service } = setup();
    await expectInvalid(service.addRecipe(HID, UID, draft(), new Blob(['x'], { type: 'text/html' })), 'invalid-photo');
  });

  it('rejects a photo over the size limit', async () => {
    const { service } = setup();
    const big = new Blob([new Uint8Array(MAX_PHOTO_BYTES + 1)], { type: 'image/webp' });
    await expectInvalid(service.addRecipe(HID, UID, draft(), big), 'invalid-photo');
  });

  it('deletes the uploaded photo and reports the original error when the recipe cannot be saved', async () => {
    const backend = createMemoryDataBackend().recipes;
    const deleted: string[] = [];
    const failing = {
      ...backend,
      uploadPhoto: async () => 'https://storage.example/photo.webp',
      deletePhoto: async (url: string) => { deleted.push(url); },
      addRecipe: async () => { throw new Error('firestore unavailable'); },
    };
    const service = createRecipeService(failing);
    await expect(service.addRecipe(HID, UID, draft(), new Blob(['x'], { type: 'image/webp' }))).rejects.toThrow('firestore unavailable');
    expect(deleted).toEqual(['https://storage.example/photo.webp']);
  });
});
