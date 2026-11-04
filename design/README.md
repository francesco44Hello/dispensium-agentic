# Design

Mockups and design decisions for Dispensium, kept next to the code so they stay findable and match the real app.

## Layout

```
design/
  README.md                 ← this file: how to make a mockup
  system/
    brand.md                ← look and feel rules
    base.html               ← starter screen (app shell + grocery list), copy it for every new mockup
    mockup.js               ← loads the app's real CSS Modules into a static page
    ui-icons.svg            ← the Material icons the app uses (menu, nav tabs, add, drag handle)
  features/
    <feature-slug>/         ← one folder per feature, e.g. list-personalization
      decisions.md          ← what was decided and why (data model, placement, edge cases)
      <screen>.html         ← one mockup per screen or state
      <screen>.png          ← a capture of each mockup, for quick review in the PR
```

## View a mockup

Serve the repo root (mockups load `/app/globals.css`, `/components/**/*.module.css` and `/public/...` by absolute path, so opening the file directly does not work):

```bash
python3 -m http.server 4321 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4321/design/system/base.html`. Check at 415px wide (the visual QA size) and at 1024px+ for desktop.

## Make a mockup (rules for agents)

1. **Start from `system/base.html`.** Copy it to `features/<feature-slug>/<screen>.html`. Keep the app shell (header, `<main>`, bottom nav). Replace only what sits between the `▼`/`▲` markers.
2. **Reuse real component styles.** List the CSS Modules the screen uses in the `data-modules` attribute of the `mockup.js` script tag. A class `.row` in `GroceryItemRow.module.css` is written `class="GroceryItemRow__row"`. Never copy component CSS into the mockup.
3. **New components only** get styles in the mockup's `<style>` block, using tokens from `app/globals.css` (`var(--primary-color)`, `var(--muted)`, …). No literal colours unless `screenshots/` shows one that has no token (see `system/brand.md`). Write this CSS as if it were the future `*.module.css`, because the build ticket will move it there.
4. **Icons:** category and meal icons from `/public/icons/sprite.svg` (`cat-*`, `meal-*`); interface icons from `/design/system/ui-icons.svg` (`md-*`). Add a new Material icon to `ui-icons.svg` only if the app will use it through `react-icons/md`.
5. **Real content:** realistic Italian/English grocery names, and every state the ticket needs (empty, loading, error, long names, many categories).
6. **Mobile first:** design at 415px; the content column is max 480px. Touch targets are at least 44px.
7. **Capture each mockup** to a `.png` beside it at 415×900 and include the images in the PR.
8. **Write `decisions.md`** for any choice the build ticket depends on.

Mockups are static HTML: no app logic and no Firebase. They never change files outside `design/`.
