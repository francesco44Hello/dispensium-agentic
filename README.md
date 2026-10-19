# Dispensium

Household dispensary app built with Next.js (App Router), React and Firebase.

## Commands

- `npm run dev` – start the dev server on http://localhost:3000
- `npm run test` – run the Vitest suite
- `npm run lint` – run ESLint

## Authentication

- `/signup`, `/login` – email/password flows (Firebase Auth).
- `/` – protected; unauthenticated visitors are redirected to `/login`.
- `/dev/auth` – mock UI for exercising the auth flow.
- `/` – grocery list for the signed-in user's active household (real-time via subscriptions).
- `/household` – members, invite codes (valid 7 days) and joining a household by code.

## Data model

- `users/{uid}` – `activeHouseholdId`. Every user gets a default household on first sign-in.
- `households/{hid}/members/{uid}` – membership and role. Lists are keyed by uid, never email.
- `households/{hid}/groceries/{id}` – shopping items with their category.
- `households/{hid}/configuration/categoryMap` – per-household keyword map used for categorisation.
- `inviteCodes/{code}` – short-lived invites that point at a household.

## Backends

- Mock mode (`NEXT_PUBLIC_AUTH_MOCK=true` or no Firebase key) keeps auth, households and groceries in memory.
- Otherwise the app uses Firebase Auth and Firestore. Access control lives in `firestore.rules`.
- The rules are a draft: they have not yet been tested with the Firestore emulator, which needs Java.

Set `NEXT_PUBLIC_AUTH_MOCK=true` (or omit the Firebase API key) to run against the in-memory mock backend instead of Firebase.
