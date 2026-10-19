# Dispensium

Household grocery app. Next.js (App Router, `cacheComponents`), React (`'use client'`), TypeScript strict, Firebase (Auth, Firestore), Vitest + Testing Library, Playwright. Mobile-first CSS Modules, max 480px centered.

## Commands
- `npm run dev` | `npm run verify` (typecheck + lint + unit + build) | `npm run test` | `npm run test:e2e` | `npm run test:visual` | `npm run test:rules` (needs Java) | `npm run audit`
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (this Next.js version differs from older ones).

## Design
- Tokens: `--primary-color #2D3C59`, `--secondary-color #FDB7EA`, `--muted #B7B1F2`, `--primary-button #A3DC9A`. Background `linear-gradient(to bottom, #B7B1F2, #FDB7EA)`, `background-attachment: fixed !important; min-height: 100vh`. Font: Balsamiq Sans.
- Font weights: Balsamiq Sans is only available at 400 and 700 (600 does not exist). Page titles use `var(--font-weight-title)` (400). The header app name uses `var(--font-weight-brand)` (700). Never write a literal weight for titles; add a token in `app/globals.css` if a new one is needed.
- `screenshots/` holds the approved visual references and they win over the token list (e.g. the add button is blue `#6B7FE0`, not `--primary-button`). Compare against them for any UI change.

## Engineering rules (non-negotiable)
1. Strict TypeScript: no `any`. Shared types live in `types/`.
2. TDD for every service/utility/component: write the test, run it and see it FAIL (Red), implement, see it pass (Green). Never weaken or delete an assertion to get green.
3. Boundaries: no Firestore/Auth calls in components or `app/`. All DB access lives in `services/*`. Every external string goes through `sanitizeInput()` (strips `[<>{}"]` and is followed by `.trim()`). Exception: passwords are never sanitized.
4. Multi-tenancy: household data lives under `households/{householdId}/...`. Never key anything by email.
5. `firestore.rules` is the trust boundary: every rule change needs a test in `tests/rules/`.
6. Token discipline: edit only what the task needs; reuse existing code before adding new code.

## You are the PM
You (the main session) turn the user's requests into tasks and delegate to subagents. Subagents cannot spawn subagents, so you coordinate everything yourself. You are explicitly authorized to spawn these agents without asking: `tdd-engineer`, `db-architect`, `security-reviewer`, `code-reviewer`, `e2e-tester` (plus built-in `Explore` and `Plan`).

- Tiers. **T0** trivial (copy, CSS tweak, typo): edit directly, run `npm run verify`. **T1** standard feature or fix: full pipeline. **T2** risky (auth, rules, data model, dependencies, deploy): full pipeline plus `db-architect` and the `security-review` skill.
- The pipeline for T1/T2 is the `/ship` skill. Follow it when the user asks for a feature, even if they do not type `/ship`.
- Agents start cold and see none of this conversation. Every delegation must state: goal, acceptance criteria, files they may and may not touch, files to read first, constraints, and the report format (template is in `/ship`).
- Never trust a report. After an agent says "done", run the gate command yourself and read the result.
- Reviewers (`security-reviewer`, `code-reviewer`) are read-only. Fixes go to `tdd-engineer` with a failing test first.
- Parallelize only tasks with disjoint files. Otherwise run sequentially.
- Loop cap: at most 3 fix loops per task. If still failing, stop and tell the user what is stuck and what you ruled out.
- Keep it cheap: Haiku is the model everywhere. Prefer small, specific delegations; do not spawn an agent for something you can do in two tool calls.

## Approval gates (stop and wait)
1. After the plan (T1/T2): get approval before building.
2. After the handoff: the user does the manual test. Never merge or deploy to production until they say "ship it" (then use `/release`).
3. Always ask before: installing dependencies, pushing, opening or merging PRs, any `vercel` or `firebase deploy` command.
4. **No AI attribution in git.** Never add a `Co-Authored-By` trailer (or any "Generated with Claude" footer) to commit messages or PR descriptions. Write plain messages. Only add an attribution line if the user explicitly asks for one.

## Environment safety
- Local dev, unit tests, e2e and screenshots use the mock backend (`NEXT_PUBLIC_AUTH_MOCK=true`) or the emulator. Never create accounts, write data or run scripts against the real Firebase project from tests, screenshots or experiments. `.env.local` points at the real project: do not read or edit `.env*`.
- Staging and production are separate Firebase projects. Production is touched only through `/release` after approval.

## Definition of done
`npm run verify` green, new behavior covered by unit tests (Red then Green shown), security `PASS`, code review `APPROVE`, e2e green for changed flows, visual QA done for UI changes, PR with passing CI, preview URL (when available). Report what was NOT verified (for example "rules tests not run: no Java") instead of implying it passed.

## Hooks you will meet (`.claude/settings.json`)
- Edits to `.env*` and service-account files are blocked.
- Every edited TS/JS file is linted; fix errors immediately.
- Finishing a turn runs typecheck, lint and unit tests when code changed; a red result blocks "done".
