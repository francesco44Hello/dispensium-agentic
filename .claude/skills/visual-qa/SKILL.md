---
name: visual-qa
description: Capture the app in mock mode and compare it against the approved reference screenshots in screenshots/. Use after any UI change, before handing off.
---
# Visual QA

Never run this against a real Firebase project: the capture uses the mock backend and the Playwright fixture fails on any Firebase request.

1. `npm run test:visual` — captures `e2e-artifacts/visual/{login,list,household}.png` at 415x900 @2x.
2. Read the reference `screenshots/shopping-list.jpg` and `e2e-artifacts/visual/list.png` with the Read tool.
3. Compare item by item and write a short list of differences: header, title, input and add button, category headings, rows and dividers, checkbox style, strike-through, "Grocery completed" button, bottom nav, fonts (Balsamiq Sans), colors and spacing.
4. Fix every difference that is not intentional, rerun step 1, and compare again. Stop after 3 rounds and report what still differs.
5. In the handoff, list intentional differences (for example the add button color follows the reference screenshot, not the token list).

Notes: `login.png` and `household.png` have no approved reference yet; check them for layout breaks only. The Next.js dev badge never appears in `next start` captures.
