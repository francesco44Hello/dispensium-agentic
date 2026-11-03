---
name: change-report
description: Build a visual HTML breakdown of a T1 or T2 change on the current branch: what changed, which critical files were touched, the reasoning behind each, and what was verified or left unverified. Use before handoff for any T1/T2 change, or when the user asks for a change report or breakdown.
---
# Change report

Only for T1 and T2 changes. T0 gets no report. The report is a local, self-contained HTML page at `e2e-artifacts/change-report/index.html` (gitignored, never committed).

## 1. Gather the reasoning
You already know why each file changed. Write it down in a notes file in the scratchpad directory (not in the repo), for example `<scratchpad>/change-notes.json`:

```json
{
  "title": "Short name of the change",
  "tier": "T2",
  "summary": "One or two sentences: what the user now gets.",
  "why": "The reasoning: the problem, the approach chosen, and the alternative rejected, in plain prose.",
  "decisions": ["Each non-obvious choice, one per item"],
  "files": {
    "services/listService.ts": "Why this file changed, one or two sentences",
    "firestore.rules": "Why this rule changed"
  },
  "verification": [
    { "name": "npm run verify", "result": "pass", "detail": "unit 212 passed" },
    { "name": "npm run test:rules", "result": "not-run", "detail": "no Java installed" }
  ],
  "reviews": [
    { "agent": "code-reviewer", "verdict": "APPROVE" },
    { "agent": "security-reviewer", "verdict": "PASS" }
  ],
  "gaps": ["Anything not verified, with the reason"]
}
```

Rules for the notes:
- `result` is one of `pass`, `fail`, `not-run`. Never write `pass` for a check you did not run.
- `files` should cover every changed file. Keys are repo-relative paths exactly as git prints them.
- `verdict` is what the reviewer reported (`APPROVE`, `PASS`, `REQUEST_CHANGES`, `FAIL`).

## 2. Build the report
From the repo root, run:

```
node .claude/skills/change-report/scripts/build-report.mjs <scratchpad>/change-notes.json --base origin/main
```

The script prints the absolute path of the generated file. It reads git itself (files, line counts, commits, critical paths) and flags critical files, the suggested tier, and warnings such as a missing required review.

## 3. Check it
- Read the warnings banner. A suggested tier above the tier you wrote, or a missing required review, must be fixed before handoff.
- Open the file in the browser to confirm it renders. Do not paste the HTML into chat.

## 4. Handoff
Give the user the absolute path of the report in one line, plus the tier, and any warnings still showing. Do not repeat the report contents in chat.

Notes: the report reflects the working tree against the base, so run it after the last edit. Rerun it after any later change, since it is a snapshot. The script handles git only; it does not run tests or reviewers, so the notes must come from the real results.
