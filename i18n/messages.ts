import type { Locale } from './locale';

// English is the source of truth. Italian is typed against it, so a missing key fails typecheck.
const en = {
  'language.label': 'Language',
  'language.english': 'English',
  'language.italian': 'Italiano',

  'auth.login': 'Log in',
  'auth.signup': 'Create account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.submit.wait': 'Please wait…',
  'auth.submit.signup': 'Sign up',
  'auth.or': 'or',
  'auth.google': 'Continue with Google',
  'auth.haveAccount': 'Already have an account?',
  'auth.newHere': 'New here?',
  'auth.createAccountLink': 'Create an account',
  'auth.error.invalidEmail': 'Please enter a valid email address.',
  'auth.error.weakPassword': 'Password must be at least 6 characters.',
  'auth.error.emailInUse': 'An account with this email already exists.',
  'auth.error.invalidCredentials': 'Email or password is incorrect.',
  'auth.error.unknown': 'Something went wrong. Please try again.',
  'auth.error.passwordMismatch': 'Passwords do not match.',
  'nav.shopping': 'Shopping',
  'nav.recipes': 'Recipes',
  'nav.menu': 'Menu',
  'nav.household': 'Household',
  'nav.addRecipe': 'Add recipe',
  'nav.main': 'Main',
  'nav.openMenu': 'Open menu',
  'nav.logOut': 'Log out',
  'menu.label': 'Menu',
  'menu.close': 'Close menu',
  'menu.tagline': 'Plan. Shop. Cook.',
  'menu.explore': 'Explore',
  'menu.shoppingList': 'Shopping List',
  'menu.weeklyMenu': 'Weekly Menu',
  'menu.rights': 'All rights Reserved',
};

export type MessageKey = keyof typeof en;

const it: Record<MessageKey, string> = {
  'language.label': 'Lingua',
  'language.english': 'English',
  'language.italian': 'Italiano',

  'auth.login': 'Accedi',
  'auth.signup': 'Crea account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Conferma password',
  'auth.submit.wait': 'Attendere…',
  'auth.submit.signup': 'Registrati',
  'auth.or': 'oppure',
  'auth.google': 'Continua con Google',
  'auth.haveAccount': 'Hai già un account?',
  'auth.newHere': 'Sei nuovo qui?',
  'auth.createAccountLink': 'Crea un account',
  'auth.error.invalidEmail': 'Inserisci un indirizzo email valido.',
  'auth.error.weakPassword': 'La password deve avere almeno 6 caratteri.',
  'auth.error.emailInUse': 'Esiste già un account con questa email.',
  'auth.error.invalidCredentials': 'Email o password non corrette.',
  'auth.error.unknown': 'Qualcosa è andato storto. Riprova.',
  'auth.error.passwordMismatch': 'Le password non coincidono.',
  'nav.shopping': 'Spesa',
  'nav.recipes': 'Ricette',
  'nav.menu': 'Menu',
  'nav.household': 'Famiglia',
  'nav.addRecipe': 'Aggiungi ricetta',
  'nav.main': 'Principale',
  'nav.openMenu': 'Apri menu',
  'nav.logOut': 'Esci',
  'menu.label': 'Menu',
  'menu.close': 'Chiudi menu',
  'menu.tagline': 'Pianifica. Compra. Cucina.',
  'menu.explore': 'Esplora',
  'menu.shoppingList': 'Lista della spesa',
  'menu.weeklyMenu': 'Menu settimanale',
  'menu.rights': 'Tutti i diritti riservati',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, it };

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
