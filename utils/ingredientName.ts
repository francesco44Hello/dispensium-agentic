import {
  ARTICLE_WORDS,
  CONNECTOR_WORDS,
  FRACTION_TEXT,
  GLUED_CONNECTOR,
  PINCH_WORDS,
  SEPARATOR_WORDS,
  SIZE_WORDS,
  TRAILING_PHRASE,
  UNIT_WORDS,
} from '../constants/ingredientUnits';

// Turns a recipe line such as "60g/2¼oz mature cheddar, grated" into a shopping name: "mature cheddar".
// Never throws; when nothing sensible is left, the original text is returned.

// A number, a fraction or a range, with an optional glued unit. Returns that unit ('g' in "60g"), or '' for a bare
// number, or null when the token is not a quantity. "7up" is not one, because "up" is no unit.
const QUANTITY = /^(\d+(?:[.,]\d+)?(?:\/\d+)?(?:[-–]\d+(?:[.,]\d+)?(?:\/\d+)?)?)(\p{L}*)\.?$/u;
// A bare trailing number is only stripped when it cannot be part of a name, such as "Pasta 00".
const PLAIN_AMOUNT = /^[1-9]\d{0,2}$/;

function parseQuantity(token: string): string | null {
  const match = QUANTITY.exec(token);
  if (!match) return null;
  const unit = match[2].toLowerCase();
  if (unit && !UNIT_WORDS.has(unit)) return null;
  // A bare number with a leading zero is part of a name ("00 flour"), not an amount. "0.5" is still an amount.
  if (!unit && /^0\d/.test(match[1])) return null;
  return unit;
}

function isQuantity(token: string): boolean {
  return parseQuantity(token) !== null;
}

function word(token: string): string {
  return token.toLowerCase().replace(/\.$/, '');
}

function isUnit(token: string): boolean {
  return UNIT_WORDS.has(word(token));
}

function normalise(raw: string): string {
  return raw
    .replace(/ /gu, ' ')
    .replace(/’/gu, "'")
    .replace(/[¼½¾⅓⅔⅛]/gu, (fraction) => FRACTION_TEXT[fraction] ?? fraction)
    .replace(/fl\s+oz/giu, 'floz')
    .replace(/(\p{L})\/(\d)/gu, '$1 / $2')
    .replace(/\([^)]*\)/gu, ' ')
    .replace(/\(.*$/u, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

// Preparation notes follow a comma or a semicolon: "2 eggs, beaten". A comma between digits is a decimal and stays.
function cutClauses(text: string): string {
  const cut = text.search(/;|,(?!\d)/u);
  return (cut >= 0 ? text.slice(0, cut) : text).trim();
}

function stripLeading(tokens: string[]): string[] {
  const words = [...tokens];
  let last: 'start' | 'qty' | 'unit' | 'connector' = 'start';

  while (words.length > 1) {
    const token = words[0];
    const lower = word(token);
    const next = words[1];

    if (last === 'start' && ARTICLE_WORDS.has(lower) && PINCH_WORDS.has(word(next))) {
      words.shift();
      last = 'qty';
      continue;
    }
    if (isQuantity(token)) {
      words.shift();
      last = 'qty';
      continue;
    }
    if (last !== 'start' && SEPARATOR_WORDS.has(lower) && isQuantity(next)) {
      words.shift();
      continue;
    }
    if (last === 'qty' && isUnit(token)) {
      words.shift();
      last = 'unit';
      continue;
    }
    if (last !== 'start' && last !== 'connector' && SIZE_WORDS.has(lower)) {
      words.shift();
      last = 'unit';
      continue;
    }
    if ((last === 'qty' || last === 'unit') && CONNECTOR_WORDS.has(lower)) {
      words.shift();
      last = 'connector';
      continue;
    }
    break;
  }

  // "1 spicchio d'aglio": the elided article is glued to the food word that comes right after the measure.
  const glued = (last === 'qty' || last === 'unit') && words.length > 0 ? GLUED_CONNECTOR.exec(words[0]) : null;
  if (glued) words[0] = glued[1];
  return words;
}

function stripTrailing(tokens: string[]): string[] {
  const words = [...tokens];
  let unitStripped = false;

  while (words.length > 1) {
    const token = words[words.length - 1];
    const before = words[words.length - 2];

    if (!unitStripped && isUnit(token) && isQuantity(before)) {
      words.pop();
      unitStripped = true;
      continue;
    }
    if (isQuantity(token) && (parseQuantity(token) !== '' || unitStripped || PLAIN_AMOUNT.test(token))) {
      words.pop();
      unitStripped = true;
      continue;
    }
    break;
  }
  return words;
}

// Keeps the original text when the cleaned name would be empty or a single letter.
export function cleanIngredientName(raw: string): string {
  const original = raw.replace(/\s+/gu, ' ').trim();
  // The steps are plain string work and should never throw. This guard keeps a bad line from breaking the cart button.
  try {
    const text = cutClauses(normalise(raw)).replace(TRAILING_PHRASE, '$1').trim();
    if (!text) return original;

    const tokens = text.split(' ').filter(Boolean);
    const cleaned = stripTrailing(stripLeading(tokens))
      .join(' ')
      .replace(/^[\s.:\-*•,]+|[\s.:\-*•,]+$/gu, '');
    return cleaned.length < 2 ? original : cleaned;
  } catch {
    return original;
  }
}
