# Brand and look

The source of truth is the code: tokens in `app/globals.css`, component styles in `components/**/*.module.css`. Approved references are in `screenshots/`, and they win over the token list when the two disagree. This file only covers what the code cannot say.

## Feel
Playful and friendly, like a hand-drawn shopping list: rounded shapes, Balsamiq Sans, soft lilac-to-pink gradient, navy ink. Copy is short and informal ("What's missing?", "Grocery completed").

## Colour roles
| Token | Use |
|---|---|
| `--primary-color` (navy) | text, borders, row dividers, the bottom nav background |
| `--muted` (lilac) | active nav tab blob, focus outline |
| `--secondary-color` (pink) | nav labels and icons on navy |
| `--primary-button` (green) | primary action buttons, checked checkbox |
| `--add-button` (blue `#6B7FE0`) | the add-item button (from the reference screenshot, not `--primary-button`) |
| `--surface` / `--surface-tint` | cards that sit on the gradient |
| `--error-color` | error messages |

The page background is always the `body` gradient from `globals.css`. Never paint a screen white.

## Type
- Balsamiq Sans only, at 400 and 700. **600 does not exist.**
- Page titles: `var(--font-weight-title)` (400), about `1.75rem`.
- Category headings, buttons, nav labels: `var(--font-weight-brand)` (700).
- Never write a literal font weight; add a token in `app/globals.css` if a new one is needed.

## Shapes
- Inputs and square buttons: 2px navy border, 12px radius, 56px tall.
- Pill buttons: fully rounded (`border-radius: 30px`), 56px tall.
- List rows: 16px vertical padding, 2px navy divider underneath.
- The floating nav pill and fixed footer button sit above content; content reserves `var(--content-bottom)`.

## Icons
- Category/meal icons: `/public/icons/sprite.svg`, drawn in `currentColor` with a soft drop shadow next to headings.
- Interface icons: Material Design (`react-icons/md`); static copies in `ui-icons.svg`.
