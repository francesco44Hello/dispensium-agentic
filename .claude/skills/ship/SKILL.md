---
name: ship
description: Run the full delivery pipeline (plan, TDD build, security, review, e2e, PR, preview, handoff) for a non-trivial feature, fix or change. Use when the user asks for something new or says /ship.
---
# /ship <request>

You are the PM. Run the stages in order. A stage's gate must pass before the next stage starts. YOU run every gate command yourself; never accept "done" from an agent without re-running it.

## 0. Intake
Classify the tier from CLAUDE.md (T0 trivial, T1 standard, T2 risky) and tell the user in one line.
T0: edit directly, run `npm run verify`, hand off. Skip the rest.

## 1. Plan (T1, T2)
If scope is unclear, use the `Explore` agent to find code to reuse. Write: goal, testable acceptance criteria, tasks with the files each one owns, risks. Show it to the user and WAIT for approval. Ask only questions you cannot answer yourself.

## 2. Data and rules (T2, or any data-model/rules change)
Delegate to `db-architect`. Gate: failing rules tests exist. If Java is missing, record "rules tests NOT run" and carry it into the handoff.

## 3. Build
Delegate each task to `tdd-engineer` (template below). Run tasks in parallel only if their files are disjoint. Gate: report contains Red evidence and Green evidence.

## 4. Gate A (you run it)
`npm run verify` (typecheck, lint, unit tests, build). Failure: send the output back to `tdd-engineer`. Max 3 fix loops across stages 4-6, then stop and tell the user what is stuck.

## 5. Security
Delegate to `security-reviewer` with the list of changed files; run `npm run audit`; for T2 also run the `security-review` skill. High/Critical finding: `tdd-engineer` writes a failing test for it, fixes it, then repeat stages 4-5.

## 6. Code review
Delegate to `code-reviewer`. REQUEST CHANGES: back to stage 3.

## 7. E2E and visual
New or changed user flow: delegate to `e2e-tester`, then run `npm run test:e2e` yourself. UI change: run the `visual-qa` skill.

## 8. PR and CI
Branch `feat/<slug>`, commit (end the message with the Co-Authored-By line from the attribution reminder), `gh pr create` with a summary and an evidence table (commands and results). Then `gh pr checks --watch`. Red CI: back to stage 3.
If `gh` is missing or unauthenticated, stop and give the user the exact commands (`brew install gh`, `gh auth login`).

## 9. Preview
Take the Vercel preview URL from the PR. If Vercel is not set up yet, say so in the handoff.

## 10. Handoff, then STOP
Never merge or deploy here. Send:
```
Ready for manual test: <one-line summary>
Tier: T? | Preview: <url or "not set up"> | PR: <url>
Evidence: verify OK | unit N passed | e2e N passed | security PASS | review APPROVE | rules tests: run/NOT run
Manual test checklist: <5-10 concrete steps with expected result>
Known gaps / risks: <list, or "none">
Say "ship it" to deploy to production.
```

## Delegation template (agents start cold, so include all of it)
```
Goal: <one sentence>
Acceptance criteria: <testable bullets>
Files you may touch: <paths>   Files you must not touch: <paths>
Context to read first: CLAUDE.md, <relevant existing files to reuse>
Constraints: strict TS, sanitizeInput in services, no weakened tests, never touch prod or .env*
Report: files changed, Red evidence, Green evidence, typecheck/lint result, open concerns
```
