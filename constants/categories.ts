import type { CategoryMap } from '../types/category';

// Ported from the legacy shopping-list app (lib/categories.js).
// Order matters: the first category with a matching keyword wins.
export const defaultCategoryMap: CategoryMap = {
  fruits: [
    'apple', 'banana', 'melon', 'orange', 'grape', 'strawberry', 'blueberry',
    'raspberry', 'blackberry', 'peach', 'plum', 'pear', 'cherry', 'mango',
    'pineapple', 'kiwi', 'watermelon', 'lemon', 'lime', 'grapefruit',
    'pomegranate', 'apricot', 'fig', 'papaya', 'nectarine', 'coconut', 'avocado',
    'mela', 'arancia', 'uva', 'fragola', 'mirtillo', 'lampone', 'mora', 'pesca',
    'prugna', 'pera', 'ciliegia', 'ananas', 'anguria', 'cocomero', 'limone',
    'pompelmo', 'melograno', 'albicocca', 'fico', 'pesca noce', 'nettarina', 'cocco',
  ],
  vegetables: [
    'carrot', 'broccoli', 'spinach', 'onion', 'garlic', 'potato', 'tomato',
    'pepper', 'cucumber', 'lettuce', 'celery', 'zucchini', 'eggplant',
    'cauliflower', 'asparagus', 'mushroom', 'cabbage', 'sweet potato', 'peas',
    'green bean', 'corn', 'kale', 'brussels sprout', 'radish', 'turnip',
    'artichoke', 'leek', 'pumpkin', 'squash', 'arugula', 'beet',
    'carota', 'spinaci', 'cipolla', 'aglio', 'patata', 'pomodoro', 'peperone',
    'cetriolo', 'lattuga', 'sedano', 'zucchina', 'melanzana', 'cavolfiore',
    'asparago', 'fungo', 'cavolo', 'patata dolce', 'piselli', 'fagiolino',
    'mais', 'cavolo nero', 'cavoletto', 'ravanello', 'rapa', 'carciofo',
    'porro', 'zucca', 'rucola', 'barbabietola',
  ],
  dairy: [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
    'cream cheese', 'cottage cheese', 'egg', 'margarine', 'kefir', 'ghee',
    'latte', 'formaggio', 'burro', 'panna', 'panna acida', 'uovo', 'uova',
    'margarina', 'fiocchi di latte', 'stracchino', 'mozzarella', 'parmigiano',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'bacon', 'sausage', 'turkey', 'lamb', 'duck',
    'veal', 'ham', 'prosciutto', 'salami', 'chorizo', 'pepperoni', 'venison',
    'steak', 'ribs', 'mince', 'burger', 'meatball',
    'pollo', 'manzo', 'maiale', 'pancetta', 'guanciale', 'salsiccia', 'tacchino',
    'agnello', 'anatra', 'vitello', 'prosciutto cotto', 'prosciutto crudo',
    'salame', 'bistecca', 'costine', 'macinato', 'hamburger', 'polpetta', 'affettati',
  ],
  fish: [
    'gueldes', 'pesce spada', 'pez espada', 'calamari', 'calamar', 'chipirones',
    'gambas', 'langostinos', 'cherne', 'vieja', 'dorada', 'lubina', 'choco',
    'pulpo', 'sardina', 'mero', 'bacalao',
    'salmon', 'tuna', 'cod', 'tilapia', 'trout', 'shrimp', 'crab', 'lobster',
    'mussel', 'oyster', 'clam', 'scallop', 'squid', 'octopus', 'anchovy', 'haddock',
    'salmone', 'tonno', 'merluzzo', 'trota', 'gamberi', 'gamberetti', 'granchio',
    'aragosta', 'astice', 'cozze', 'ostriche', 'vongole', 'capesante', 'polpo', 'acciughe',
  ],
  bakery: [
    'bread', 'bagel', 'croissant', 'muffin', 'baguette', 'pita', 'tortilla',
    'bun', 'roll', 'cake', 'pie', 'pastry', 'donut', 'cookie', 'brownie',
    'sourdough', 'focaccia', 'pretzel', 'tart',
    'pane', 'cornetto', 'brioche', 'panino', 'torta', 'crostata', 'pasticcino',
    'ciambella', 'biscotto', 'lievito', 'lievito madre', 'piadina',
  ],
  pantry: [
    'pasta', 'rice', 'cereal', 'flour', 'sugar', 'salt', 'pepper', 'oil',
    'vinegar', 'soy sauce', 'ketchup', 'mustard', 'mayonnaise', 'peanut butter',
    'jam', 'jelly', 'honey', 'oat', 'lentil', 'chickpea', 'broth', 'soup',
    'coffee', 'tea', 'noodle', 'spice', 'herb', 'nutella', 'sirup', 'sauce',
    'riso', 'cereali', 'farina', 'zucchero', 'sale', 'pepe', 'olio', 'aceto',
    'salsa di soia', 'senape', 'maionese', 'marmellata', 'miele', 'avena',
    'lenticchia', 'cece', 'fagiolo', 'brodo', 'zuppa', 'minestra', 'caffè',
    'tè', 'spezia', 'erba aromatica', 'sciroppo', 'sugo', 'salsa', 'passata',
  ],
  snacks: [
    'chips', 'crisps', 'popcorn', 'nuts', 'almond', 'walnut', 'cashew',
    'chocolate', 'candy', 'cracker', 'gum', 'mint',
    'patatine', 'frutta secca', 'mandorla', 'noce', 'anacardo', 'nocciola',
    'cioccolato', 'caramella', 'gomma', 'cicca', 'mentina', 'salatini',
  ],
  drinks: [
    'water', 'soda', 'juice', 'beer', 'wine', 'kombucha', 'lemonade',
    'cider', 'champagne', 'liquor', 'vodka', 'rum', 'gin', 'whiskey',
    'acqua', 'bibita', 'succo', 'birra', 'vino', 'limonata', 'sidro',
    'liquore', 'spumante', 'prosecco', 'amaro',
  ],
  household: [
    'toilet paper', 'paper towel', 'soap', 'shampoo', 'conditioner',
    'toothpaste', 'toothbrush', 'deodorant', 'detergent', 'sponge',
    'trash bag', 'foil', 'bleach', 'cleaner', 'napkin', 'tissue',
    'carta igienica', 'scottex', 'carta assorbente', 'sapone', 'balsamo',
    'dentifricio', 'spazzolino', 'deodorante', 'detersivo', 'spugna',
    'sacchetto', 'spazzatura', 'stagnola', 'alluminio', 'candeggina',
    'detergente', 'tovagliolo', 'fazzoletto',
  ],
};

export const categoryEmojis: Record<string, string> = {
  fruits: '🍎',
  vegetables: '🥦',
  dairy: '🧀',
  meat: '🥩',
  fish: '🐟',
  bakery: '🥯',
  pantry: '🍝',
  snacks: '🍟',
  drinks: '🍾',
  household: '🪠',
  other: '🛒',
};

export const FALLBACK_CATEGORY = 'other';
