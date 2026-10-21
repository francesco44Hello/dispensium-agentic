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
You (the main session) turn the user's requests into tasks. Subagents cannot spawn subagents, so you coordinate everything yourself. Subagents are available for the cases below, and the full pipeline only when the user asks for it.

- **Build directly by default.** Write the failing test first (Red), implement (Green), then run `npm run verify:clean` and the relevant e2e specs. Reviews are not optional: the tier decides which reviewer must run (see Tiers).
- **Delegate noisy, self-contained tasks that end in a short text result:**
  1. Visual comparison against `screenshots/` -> `e2e-tester` (keeps image reads out of the main context).
  2. Broad code or legacy-repo searches -> `Explore`.
  3. Security review -> `security-reviewer` (required for T2, see Tiers).
  4. Code review -> `code-reviewer` (required for T1 and T2, see Tiers).
  5. Diagnosing a long failing log -> a delegated debugging task.
- Ask every delegated agent for a report of at most 15 lines, as text only.
- **The full `/ship` pipeline runs only when the user asks for it** (for example "/ship" or "use the pipeline").
- **Tiers and required reviews.** Run the reviews on the whole diff against `origin/main`. Report each reviewer's verdict in the chat. The PR review and required CI are the merge check.
  - **T0** trivial (CSS tweak, copy, typo, docs). No reviewer. Run `npm run verify`.
  - **T1** any TypeScript or JavaScript change. Required: `code-reviewer` (`APPROVE`).
  - **T2** auth, data access, rules, deploy, CI, or any dependency change (`package.json`, lockfile). Required: `security-reviewer` (`PASS`) and `code-reviewer` (`APPROVE`). Any change to `firestore.rules` must come with a change under `tests/rules/`. Use `db-architect` to design rules and tests; it is advisory, not a gate.
  - When unsure between two tiers, take the higher one. Tell the user which tier you chose.
- If a reviewer returns FAIL or REQUEST_CHANGES, fix with `tdd-engineer` (failing test first), then re-run that reviewer. Any edit after a review makes it stale.
- Agents start cold and see none of this conversation. Every delegation must state: goal, acceptance criteria, files they may and may not touch, files to read first, constraints, and the report format (template is in `/ship`).
- Never trust a report. After an agent says "done", run the gate command yourself and read the result.
- Reviewers (`security-reviewer`, `code-reviewer`) are read-only. Fixes go to `tdd-engineer` with a failing test first.
- Before finishing any turn with changes: the reviews required by the tier must be green. Do not present work as done without them.
- Parallelize only tasks with disjoint files. Otherwise run sequentially.
- Loop cap: at most 3 fix loops per task. If still failing, stop and tell the user what is stuck and what you ruled out.
- Haiku is the model everywhere. Delegate only the cases listed above.

## Approval gates (stop and wait)
1. After the plan (T1/T2): get approval before building.
2. After the handoff: the user does the manual test. Never merge or deploy to production until they say "ship it" (then use `/release`).
3. Always ask before: installing dependencies, pushing, opening or merging PRs, any `vercel` or `firebase deploy` command.
4. **No AI attribution in git.** Never add a `Co-Authored-By` trailer (or any "Generated with Claude" footer) to commit messages or PR descriptions. Write plain messages. Only add an attribution line if the user explicitly asks for one.

## Environment safety
- Local dev, unit tests, e2e and screenshots use the mock backend (`NEXT_PUBLIC_AUTH_MOCK=true`) or the emulator. Never create accounts, write data or run scripts against the real Firebase project from tests, screenshots or experiments. `.env.local` points at the real project: do not read or edit `.env*`.
- Staging and production are separate Firebase projects. Production is touched only through `/release` after approval.

## Definition of done
`npm run verify` green, new behavior covered by unit tests (Red then Green shown), every review the tier requires green (`security-reviewer` PASS for T2, `code-reviewer` APPROVE for T1 and T2), e2e green for changed flows, visual QA done for UI changes, PR with passing CI, preview URL (when available). Report what was NOT verified (for example "rules tests not run: no Java") instead of implying it passed.

## Hooks you will meet (`.claude/settings.json`)
- Edits to `.env*` and service-account files are blocked.
- Every edited TS/JS file is linted; fix errors immediately.
- Finishing a turn runs typecheck, lint and unit tests when code changed; a red result blocks "done".