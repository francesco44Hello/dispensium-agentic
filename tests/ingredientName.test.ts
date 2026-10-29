import { describe, it, expect } from 'vitest';
import { cleanIngredientName } from '../utils/ingredientName';

describe('cleanIngredientName', () => {
  it.each([
    ['60g/2¼oz mature cheddar, grated', 'mature cheddar'],
    ['2 tbsp olive oil', 'olive oil'],
    ['1 1/2 cups plain flour, sifted', 'plain flour'],
    ['a pinch of salt', 'salt'],
    ['3-4 cloves garlic, crushed', 'garlic'],
    ['1 (400g) can chopped tomatoes', 'chopped tomatoes'],
    ['salt and pepper, to taste', 'salt and pepper'],
    ['2 large eggs', 'eggs'],
    ['200 ml/7 fl oz double cream', 'double cream'],
    ['2 x 400g tins chickpeas', 'chickpeas'],
    ['1,5 kg potatoes', 'potatoes'],
    ['0.5 l milk', 'milk'],
    ['Salt to taste', 'Salt'],
    ['3 to 4 apples', 'apples'],
    ['½ tsp ground cumin', 'ground cumin'],
    ['1 bunch fresh coriander', 'fresh coriander'],
  ])('cleans the English line %j to %j', (raw, expected) => {
    expect(cleanIngredientName(raw)).toBe(expected);
  });

  it.each([
    ['Zucca delica (da pulire) 350 g', 'Zucca delica'],
    ['Lenticchie rosse decorticate 80 g', 'Lenticchie rosse decorticate'],
    ['Farina di ceci 50 g', 'Farina di ceci'],
    ['Scalogno 1', 'Scalogno'],
    ['Aglio 1 spicchio', 'Aglio'],
    ['Brodo vegetale 1 l', 'Brodo vegetale'],
    ["Olio extravergine d'oliva q.b.", "Olio extravergine d'oliva"],
    ['Sale fino q.b.', 'Sale fino'],
    ['Pepe nero q.b.', 'Pepe nero'],
    ['2 cucchiai di olio', 'olio'],
    ["1 spicchio d'aglio", 'aglio'],
  ])('cleans the Italian line %j to %j', (raw, expected) => {
    expect(cleanIngredientName(raw)).toBe(expected);
  });

  it('cleans a Spanish line', () => {
    expect(cleanIngredientName('2 cucharadas de aceite')).toBe('aceite');
  });

  it.each([
    ['Cloves'],
    ['Cups'],
    ['Pasta 00'],
    ['Coca-Cola 0%'],
    ['7up'],
    ["Olio d'oliva"],
    ['350'],
    ['(optional)'],
  ])('keeps %j as it is', (raw) => {
    expect(cleanIngredientName(raw)).toBe(raw);
  });

  it('strips the unit but keeps the word when it is the only word left', () => {
    expect(cleanIngredientName('1 tsp cloves')).toBe('cloves');
  });

  it('returns an empty string for an empty or blank input', () => {
    expect(cleanIngredientName('')).toBe('');
    expect(cleanIngredientName('   ')).toBe('');
  });

  it('does not throw on a long line', () => {
    const long = `${'word '.repeat(30)}`.trim();
    expect(() => cleanIngredientName(long)).not.toThrow();
  });
});
