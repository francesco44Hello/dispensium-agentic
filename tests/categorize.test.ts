import { describe, it, expect } from 'vitest';
import { getCategory, mergeCategoryMaps } from '../utils/categorize';
import { defaultCategoryMap } from '../constants/categories';
import type { CategoryMap } from '../types/category';

describe('getCategory', () => {
  it('categorises an English item using the default map', () => {
    expect(getCategory('apple', defaultCategoryMap)).toBe('fruits');
  });

  it('categorises an Italian item using the default map', () => {
    expect(getCategory('latte', defaultCategoryMap)).toBe('dairy');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(getCategory('  MILK ', defaultCategoryMap)).toBe('dairy');
  });

  it('matches a keyword inside a longer item name', () => {
    expect(getCategory('whole milk', defaultCategoryMap)).toBe('dairy');
  });

  it('returns "other" for an unknown item', () => {
    expect(getCategory('unobtainium', defaultCategoryMap)).toBe('other');
  });

  it('returns "other" for an empty string', () => {
    expect(getCategory('', defaultCategoryMap)).toBe('other');
  });

  it('returns the first matching category in map order', () => {
    const map: CategoryMap = { first: ['x'], second: ['x'] };
    expect(getCategory('x', map)).toBe('first');
  });

  it('uses the map it is given, not the default map', () => {
    const map: CategoryMap = { gadgets: ['phone'] };
    expect(getCategory('phone', map)).toBe('gadgets');
    expect(getCategory('apple', map)).toBe('other');
  });
});

describe('mergeCategoryMaps', () => {
  const defaults: CategoryMap = { fruits: ['apple'], dairy: ['milk', 'cheese'] };

  it('returns the defaults when a household has no stored map', () => {
    expect(mergeCategoryMaps(defaults, null)).toEqual(defaults);
  });

  it('adds current default keywords to an older stored map', () => {
    const stored: CategoryMap = { dairy: ['milk'] };
    expect(mergeCategoryMaps(defaults, stored).dairy).toEqual(['milk', 'cheese']);
  });

  it('keeps a category that only the stored map has, after the defaults', () => {
    const stored: CategoryMap = { dairy: ['milk'], gadgets: ['phone'] };
    expect(Object.keys(mergeCategoryMaps(defaults, stored))).toEqual(['fruits', 'dairy', 'gadgets']);
    expect(getCategory('phone', mergeCategoryMaps(defaults, stored))).toBe('gadgets');
  });

  it('dedupes keywords regardless of case', () => {
    const stored: CategoryMap = { dairy: ['Milk', 'cream'] };
    expect(mergeCategoryMaps({ dairy: ['milk'] }, stored).dairy).toEqual(['milk', 'cream']);
  });

  it('does not change either map it is given', () => {
    const stored: CategoryMap = { dairy: ['milk'] };
    mergeCategoryMaps(defaults, stored);
    expect(stored).toEqual({ dairy: ['milk'] });
    expect(defaults.dairy).toEqual(['milk', 'cheese']);
  });
});

describe('keyword coverage for common unlisted foods', () => {
  it.each([
    ['mature cheddar', 'dairy'],
    ['Parmesan', 'dairy'],
    ['Feta', 'dairy'],
    ['Mascarpone', 'dairy'],
    ['vegetable stock', 'pantry'],
    ['ground cumin', 'pantry'],
    ['Scalogno', 'vegetables'],
    ['fresh coriander', 'vegetables'],
    ['prezzemolo', 'vegetables'],
  ])('files %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });
});

describe('matching at the start of a word', () => {
  it.each([
    ['champagne', 'drinks'],
    ['goat', 'other'],
    ['apples', 'fruits'],
    ["d'oliva", 'other'],
    ['whole milk', 'dairy'],
  ])('files %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });
});

describe('common grocery corpus', () => {
  it.each([
    // dairy and eggs
    ['Ricotta', 'dairy'],
    ['Gouda', 'dairy'],
    ['Manchego', 'dairy'],
    ['Roquefort', 'dairy'],
    ['Queso fresco', 'dairy'],
    ['Crème fraîche', 'dairy'],
    ['Yogur griego', 'dairy'],
    ['Leche entera', 'dairy'],
    ['Mantequilla', 'dairy'],
    ['Huevos', 'dairy'],
    ['Whipping cream', 'dairy'],
    // fish
    ['Smoked salmon', 'fish'],
    ['Salmón', 'fish'],
    ['Prawns', 'fish'],
    ['Cod fillets', 'fish'],
    ['Tuna in oil', 'fish'],
    ['Sardines', 'fish'],
    ['Atún', 'fish'],
    ['Baccalà', 'fish'],
    // meat
    ['Chicken breast', 'meat'],
    ['Minced beef', 'meat'],
    ['Mortadella', 'meat'],
    ['Bresaola', 'meat'],
    ['Speck', 'meat'],
    ['Hot dogs', 'meat'],
    ['Ternera', 'meat'],
    ['Cerdo', 'meat'],
    // bakery
    ['Sliced bread', 'bakery'],
    ['Naan', 'bakery'],
    ['Pitta breads', 'bakery'],
    ['Grissini', 'bakery'],
    ['Panettone', 'bakery'],
    ['Bagels', 'bakery'],
    // snacks
    ['Dark chocolate', 'snacks'],
    ['Digestive biscuits', 'snacks'],
    ['Pistachios', 'snacks'],
    ['Crackers', 'snacks'],
    ['Peanuts', 'snacks'],
    // pantry: pasta, legumes, oils, baking, spices, Spanish basics
    ['Spaghetti', 'pantry'],
    ['Penne rigate', 'pantry'],
    ['Fusilli', 'pantry'],
    ['Lasagne', 'pantry'],
    ['Basmati rice', 'pantry'],
    ['Red lentils', 'pantry'],
    ['Lenticchie rosse', 'pantry'],
    ['Canned chickpeas', 'pantry'],
    ['Ceci', 'pantry'],
    ['Kidney beans', 'pantry'],
    ['Sunflower oil', 'pantry'],
    ['Balsamic vinegar', 'pantry'],
    ['Baking powder', 'pantry'],
    ['Yeast', 'pantry'],
    ['Cornflour', 'pantry'],
    ['Pesto', 'pantry'],
    ['Tahini', 'pantry'],
    ['Paprika', 'pantry'],
    ['Cinnamon', 'pantry'],
    ['Dried oregano', 'pantry'],
    ['Curry powder', 'pantry'],
    ['Chilli flakes', 'pantry'],
    ['Nutmeg', 'pantry'],
    ['Turmeric', 'pantry'],
    ['Aceite de oliva', 'pantry'],
    ['Azúcar', 'pantry'],
    ['Arroz', 'pantry'],
    ['Harina', 'pantry'],
    ['Origano', 'pantry'],
    // vegetables and fresh herbs
    ['Tinned tomatoes', 'vegetables'],
    ['Fresh dill', 'vegetables'],
    ['Chives', 'vegetables'],
    ['Sage', 'vegetables'],
    ['Salvia', 'vegetables'],
    ['Cebolla', 'vegetables'],
    ['Ajo', 'vegetables'],
    ['Tomate', 'vegetables'],
    ['Pimiento', 'vegetables'],
    ['Zanahoria', 'vegetables'],
    // fruit
    ['Limón', 'fruits'],
    ['Naranja', 'fruits'],
    ['Manzana', 'fruits'],
    ['Plátano', 'fruits'],
    ['Fresas', 'fruits'],
    // household
    ['Dish soap', 'household'],
    ['Bin bags', 'household'],
    ['Kitchen roll', 'household'],
    ['Cling film', 'household'],
    ['Baking paper', 'household'],
    ['Pellicola trasparente', 'household'],
    ['Carta da forno', 'household'],
    ['Washing-up liquid', 'household'],
    // drinks
    ['Sparkling water', 'drinks'],
    ['Tonic water', 'drinks'],
    ['Coca-Cola', 'drinks'],
    ['Limonata', 'drinks'],
    ['Limonada', 'drinks'],
  ])('files %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });
});

describe('tolerant matching', () => {
  it.each([
    // accents on either side
    ['Crème fraîche', 'dairy'],
    ['creme fraiche', 'dairy'],
    ['Jalapeño', 'vegetables'],
    ['Limón', 'fruits'],
    // Italian and Spanish endings
    ['Pomodori pelati', 'vegetables'],
    ['Mozzarelle', 'dairy'],
    // a single typo in a long keyword
    ['gorgonzolla', 'dairy'],
    ['mozarella', 'dairy'],
    ['zuchini', 'vegetables'],
  ])('files %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });

  it.each([
    // the first letter must match, so a typo cannot change the fruit
    ['beach', 'other'],
    // short words are never corrected, so one letter cannot change the category
    ['appel', 'other'],
    // an unknown food stays in other
    ['unobtainium', 'other'],
    // a stem must be the whole word plus a plural vowel, not the start of another word
    ['Lechuga', 'other'],
    ['Tortellini', 'other'],
    ['Burrito', 'other'],
  ])('keeps %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });
});
