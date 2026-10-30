// The app's own icons, drawn from public/icons/sprite.svg. They use the current text colour, so they follow the theme.
export type AppIconName =
  | 'meal-breakfast'
  | 'meal-lunch'
  | 'meal-dinner'
  | 'cat-fruits'
  | 'cat-vegetables'
  | 'cat-dairy'
  | 'cat-meat'
  | 'cat-fish'
  | 'cat-bakery'
  | 'cat-pantry-shelf'
  | 'cat-snacks'
  | 'cat-drinks'
  | 'cat-household';

interface Props {
  name: AppIconName;
  className?: string;
}

// Decorative: the text beside each icon already says what it is.
export function AppIcon({ name, className }: Props) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href={`/icons/sprite.svg#${name}`} />
    </svg>
  );
}
