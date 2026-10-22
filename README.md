# Dispensium

Household grocery app built with Next.js (App Router), React and Firebase (Auth, Firestore, Storage).

## Commands

- `npm run dev`: start the dev server on http://localhost:3000.
- `npm run dev:seed [recipe-url]`: fetch a recipe through the running dev server (mock mode) and save it for local seeding.
- `npm run typecheck`: `next typegen`, then `tsc --noEmit`.
- `npm run verify`: typecheck, lint, unit tests and a production build (`next build`).
- `npm run verify:clean`: delete `.next` first, then run `verify`. Use it before pushing, because CI starts from a clean state.
- `npm run test`: unit tests (Vitest).
- `npm run test:e2e`: end-to-end tests (Playwright) against the mock backend, on the Next dev server.
- `npm run test:visual`: visual checks against the reference screenshots.
- `npm run test:rules`: Firestore and Storage rules tests on the emulator. Needs JDK 21 or newer.
- `npm run audit`: production dependency audit, high and critical issues (`--omit=dev --audit-level=high`). This is the CI gate.
- `npm run audit:full`: audit of all dependencies, dev included, reporting every severity; not a CI gate.
- `npm run build`: production build (`next build`).
- `npm run start`: serve the production build. Run `npm run build` first.
- `npm run lint`: ESLint.

## Routes

- `/`: shopping list for the signed-in user's active household (protected).
- `/recipes`: household recipes, with import from a link or a photo.
- `/recipes/[id]`: one recipe.
- `/weekly-menu`: lunch and dinner plan per day.
- `/household`: members, invite codes (valid 7 days) and joining a household by code.
- `/login`, `/signup`: email and password sign-in.
- `/dev/auth`: mock-mode auth test panel. Returns 404 in production builds.

Protected routes send signed-out visitors to `/login`.

## Data model

Firestore:

- `users/{uid}`: `activeHouseholdId`. Every user gets a default household on first sign-in.
- `households/{hid}`: name and owner.
- `households/{hid}/members/{uid}`: role and join time. Members are keyed by uid, never by email.
- `households/{hid}/groceries/{id}`: shopping items with their category and `completed` flag.
- `households/{hid}/configuration/categoryMap`: per-household keyword map used to categorise items. Written once, at household creation.
- `households/{hid}/recipes/{id}`: title, time, category, label, ingredients, steps and an optional photo path.
- `households/{hid}/menu/{YYYY-MM-DD}`: `lunch` and `dinner` entries for one day.
- `inviteCodes/{code}`: short-lived invite that points at a household. Codes are document ids, so they cannot be listed.

Storage:

- `households/{hid}/recipes/{file}`: recipe photos (webp, jpeg or png, under 1 MB). Members upload, read and delete their household's photos. Updates are refused.

Access control lives in `firestore.rules` and `storage.rules`. Every rule change needs a test in `tests/rules/`.

## Environment setup

The app runs in one of three modes.

### Local mock (default for development and tests)

Set `NEXT_PUBLIC_AUTH_MOCK=true`. Auth, households, groceries, recipes and the menu then live in memory, and nothing is sent to Firebase. No Firebase values are needed. Mock mode is opt-in: a missing Firebase key never switches it on.

```sh
NEXT_PUBLIC_AUTH_MOCK=true npm run dev
```

### Local against Firebase (staging)

Create `.env.local` (git-ignored, never commit it) with the web app values from the Firebase console for the staging project:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Leave `NEXT_PUBLIC_AUTH_MOCK` unset. Staging is the Firebase project named `default` in `.firebaserc`.

### Production

Production is the Firebase project named `production` in `.firebaserc`. A production build without `NEXT_PUBLIC_FIREBASE_API_KEY` fails at startup instead of falling back to mock auth. Production is only deployed through the release process, after approval. Rules are deployed by the `Deploy Firestore and Storage rules (production)` workflow, which waits for approval in the `production` GitHub environment.

## Tests

- Unit tests use the mock backend and need no Firebase.
- E2E tests run the Next dev server on port 3100 with `NEXT_PUBLIC_AUTH_MOCK=true` and `E2E=1` (see `playwright.config.ts`). A guard fails any test that reaches a Firebase host, and those hosts are blocked at the network layer.
- Rules tests run on the Firebase emulators (`firebase emulators:exec`). They need Java 21 or newer.
