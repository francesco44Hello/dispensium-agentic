---
name: release
description: Deploy an approved change to production (merge, deploy, smoke test, rollback note). Only when the user has explicitly said to ship it.
---
# Release (production)

Precondition: the user explicitly approved this exact change ("ship it") after the manual test. If not, STOP and ask. Each command below needs the user's permission prompt; do not work around it.

1. Confirm the PR is green: `gh pr checks <pr>`. Not green: stop.
2. If `firestore.rules` changed: tell the user the rules deploy runs from the `deploy-rules` workflow after merge and needs their approval on the GitHub "production" environment. Rules must be live before or together with code that depends on them.
3. Merge: `gh pr merge <pr> --squash --delete-branch`. Vercel deploys `main` to production automatically.
4. Wait for the deployment: `gh run list --limit 3` and the Vercel status on the commit.
5. Read-only smoke test of production: `curl -sI <prod-url>` (200) and `curl -s <prod-url>/login` contains "Log in". Do NOT sign up, log in or write data in production.
6. Report: deployed commit, URLs checked, results, and the rollback steps below.

Rollback: Vercel dashboard (Deployments, previous deployment, "Promote to Production"), or `vercel rollback`. Rules: revert the PR that changed `firestore.rules`; the workflow redeploys the previous rules. Firestore console keeps a rules history as a fallback.

Missing setup (stop and tell the user): `gh` not installed or not authenticated; Vercel project not linked; production URL unknown.
