// Words that measure an ingredient, lowercase, without a trailing full stop. English, Italian and Spanish.
// A unit is only ever stripped next to a quantity, so a word that is also a food (can, head, piece) is safe here.
export const UNIT_WORDS: ReadonlySet<string> = new Set([
  'g', 'gr', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
  'ml', 'cl', 'dl', 'l', 'litre', 'litres', 'liter', 'liters', 'floz', 'tsp', 'teaspoon', 'teaspoons',
  'tbsp', 'tablespoon', 'tablespoons', 'cup', 'cups', 'clove', 'cloves', 'can', 'cans', 'tin', 'tins',
  'pinch', 'bunch', 'handful', 'pack', 'packet', 'packets', 'slice', 'slices', 'sprig', 'sprigs', 'stick', 'sticks',
  'piece', 'pieces', 'head', 'heads', 'dash', 'drop', 'drops',
  'cucchiaio', 'cucchiai', 'cucchiaino', 'cucchiaini', 'spicchio', 'spicchi', 'pizzico', 'pizzichi', 'mazzetto',
  'rametto', 'rametti', 'bustina', 'bustine', 'lattina', 'lattine', 'fetta', 'fette', 'foglia', 'foglie',
  'ciuffo', 'pugno', 'bicchiere', 'tazza', 'tazze',
  'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas', 'gramos', 'taza', 'tazas', 'diente', 'dientes',
  'pizca', 'pizcas', 'lata', 'latas', 'manojo', 'rama', 'ramas',
]);

// Size words such as "2 large eggs". Stripped only right after a quantity or a unit.
export const SIZE_WORDS: ReadonlySet<string> = new Set([
  'large', 'medium', 'small', 'big', 'grande', 'grandi', 'piccolo', 'piccola', 'piccoli', 'medio', 'media', 'medie',
]);

// Words that link a quantity to the food: "2 cucchiai di olio", "2 cucharadas de aceite".
export const CONNECTOR_WORDS: ReadonlySet<string> = new Set(['of', 'di', 'de', 'del', 'della', 'dei', 'delle']);

// Elided forms glued to the next word: "1 spicchio d'aglio". Only stripped right after a quantity or unit.
export const GLUED_CONNECTOR = /^(?:d'|dell'|de')(.+)$/iu;

// "a pinch of salt": the article is dropped only when a measure like this follows it.
export const ARTICLE_WORDS: ReadonlySet<string> = new Set(['a', 'an', 'un', 'una', 'uno', 'one']);
export const PINCH_WORDS: ReadonlySet<string> = new Set([
  'pinch', 'bunch', 'handful', 'pizzico', 'mazzetto', 'pugno', 'ciuffo', 'pizca', 'manojo',
]);

// Joins two quantities into a range or a dual measure: "3 to 4", "2 x 400g", "60g / 2oz".
export const SEPARATOR_WORDS: ReadonlySet<string> = new Set(['/', 'x', 'to', 'or', '-', '–']);

// Trailing notes about amount, not about the food: "salt, q.b.", "salt to taste".
export const TRAILING_PHRASE = /(^|[\s,])(q\.?\s?b\.?|quanto basta|to taste|as needed|a piacere|al gusto)$/iu;

// Vulgar fractions are written out, so "2¼oz" reads as "2 1/4oz".
export const FRACTION_TEXT: Readonly<Record<string, string>> = {
  '¼': ' 1/4',
  '½': ' 1/2',
  '¾': ' 3/4',
  '⅓': ' 1/3',
  '⅔': ' 2/3',
  '⅛': ' 1/8',
};
