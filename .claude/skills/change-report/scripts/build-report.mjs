// Builds a visual change report for the current branch against a base branch.
// Usage: node .claude/skills/change-report/scripts/build-report.mjs <notes.json> [--base origin/main]
// Git facts (files, churn, commits, critical paths) come from the repo.
// Reasoning, tier and verification come from the notes file the agent writes.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const baseIndex = args.indexOf('--base');
const base = baseIndex >= 0 ? args[baseIndex + 1] : 'origin/main';
const notesPath = args.find((arg, index) => !arg.startsWith('--') && index !== baseIndex + 1);
if (!notesPath) {
  console.error('Usage: build-report.mjs <notes.json> [--base origin/main]');
  process.exit(1);
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (...gitArgs) =>
  execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const lines = (text) => text.split('\n').filter(Boolean);

try {
  git('rev-parse', '--verify', base);
} catch {
  console.error(`Base "${base}" not found. Run \`git fetch origin\` or pass --base <ref>.`);
  process.exit(1);
}

const notes = JSON.parse(readFileSync(notesPath, 'utf8'));
// Diff from the fork point, so commits on this branch plus uncommitted edits show up,
// even when the base branch was rebased or squashed and shares no direct ancestry.
const forkPoint = git('merge-base', base, 'HEAD');

// Critical paths: a match here makes the file part of the T2 review scope.
const PATH_RULES = [
  [/^firestore\.rules$/, 'security rules'],
  [/^tests\/rules\//, 'rules tests'],
  [/^package(-lock)?\.json$/, 'dependency change'],
  [/^\.github\//, 'CI'],
  [/^(firebase|vercel)\.json$/, 'deploy config'],
  [/^next\.config\./, 'build config'],
  [/auth/i, 'auth'],
];
const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const FIREBASE_DATA = /from\s+['"]firebase\/(firestore|auth)['"]/;
const REQUIRED_REVIEWERS = { T0: [], T1: ['code-reviewer'], T2: ['code-reviewer', 'security-reviewer'] };
const TIER_RANK = { T0: 0, T1: 1, T2: 2 };
const OK_VERDICTS = ['APPROVE', 'PASS'];

function criticalReasons(path) {
  const reasons = PATH_RULES.filter(([pattern]) => pattern.test(path)).map(([, label]) => label);
  const absolute = join(root, path);
  if (CODE_FILE.test(path) && existsSync(absolute) && FIREBASE_DATA.test(readFileSync(absolute, 'utf8'))) {
    reasons.push('touches Firestore or Auth');
  }
  return reasons;
}

function countLines(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return 0;
  return readFileSync(absolute, 'utf8').split('\n').length;
}

const STATUS_WORDS = { A: 'added', M: 'modified', D: 'deleted' };
const statusByPath = new Map(
  lines(git('diff', '--name-status', '--no-renames', forkPoint)).map((line) => {
    const [code, path] = line.split('\t');
    return [path, code];
  }),
);
const numstatByPath = new Map(
  lines(git('diff', '--numstat', '--no-renames', forkPoint)).map((line) => {
    const [added, deleted, path] = line.split('\t');
    return [path, { added: Number(added) || 0, deleted: Number(deleted) || 0 }];
  }),
);
const untracked = lines(git('ls-files', '--others', '--exclude-standard'));

const files = [...new Set([...statusByPath.keys(), ...untracked])].map((path) => {
  const code = untracked.includes(path) ? 'A' : statusByPath.get(path);
  const counts = numstatByPath.get(path) ?? { added: countLines(path), deleted: 0 };
  return {
    path,
    status: STATUS_WORDS[code] ?? 'modified',
    added: counts.added,
    deleted: counts.deleted,
    reasons: criticalReasons(path),
    why: notes.files?.[path] ?? '',
  };
});
files.sort((a, b) => b.added + b.deleted - (a.added + a.deleted));

const suggestedTier = files.some((file) => file.reasons.length > 0)
  ? 'T2'
  : files.some((file) => CODE_FILE.test(file.path))
    ? 'T1'
    : 'T0';
const tier = notes.tier ?? suggestedTier;
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const commits = lines(git('log', '--oneline', `${forkPoint}..HEAD`));
const totals = files.reduce(
  (sum, file) => ({ added: sum.added + file.added, deleted: sum.deleted + file.deleted }),
  { added: 0, deleted: 0 },
);
const critical = files.filter((file) => file.reasons.length > 0);
const maxChurn = Math.max(1, ...files.map((file) => file.added + file.deleted));

const warnings = [];
if (TIER_RANK[suggestedTier] > TIER_RANK[tier]) {
  warnings.push(`Changed files suggest ${suggestedTier}, but the report says ${tier}. Check the tier.`);
}
const withoutReason = files.filter((file) => !file.why).length;
if (withoutReason > 0) warnings.push(`${withoutReason} changed file(s) have no reason in the notes.`);
const reviews = notes.reviews ?? [];
for (const agent of REQUIRED_REVIEWERS[tier]) {
  const review = reviews.find((item) => item.agent === agent);
  if (!review || !OK_VERDICTS.includes(review.verdict)) {
    warnings.push(`Required ${agent} review for ${tier} is missing or not green.`);
  }
}

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const chip = (label, kind) => `<span class="chip chip-${kind}">${esc(label)}</span>`;
const resultKind = { pass: 'pass', fail: 'fail', 'not-run': 'warn' };

const groups = new Map();
for (const file of files) {
  const folder = file.path.includes('/') ? file.path.split('/')[0] : '(root)';
  groups.set(folder, [...(groups.get(folder) ?? []), file]);
}

const criticalCards = critical
  .map(
    (file) => `
      <article class="card">
        <h3><code>${esc(file.path)}</code></h3>
        <p>${file.reasons.map((reason) => chip(reason, 'accent')).join(' ')} ${chip(file.status, 'muted')}</p>
        <p class="prose">${esc(file.why || 'No reason recorded.')}</p>
      </article>`,
  )
  .join('') || '<p class="muted">No critical files in this change.</p>';

const folderSections = [...groups]
  .map(
    ([folder, group]) => `
      <section class="group">
        <h3>${esc(folder)} <span class="muted">${group.length} file${group.length === 1 ? '' : 's'}</span></h3>
        ${group
          .map((file) => {
            const churn = file.added + file.deleted;
            const width = Math.max(2, Math.round((churn / maxChurn) * 100));
            return `
        <div class="row">
          <div class="row-name"><code title="${esc(file.path)}">${esc(file.path.split('/').pop())}</code>
            ${file.reasons.length ? chip('critical', 'accent') : ''} ${chip(file.status, 'muted')}</div>
          <div class="bar"><span style="width:${width}%"></span></div>
          <div class="row-count"><span class="plus">+${file.added}</span> <span class="minus">-${file.deleted}</span></div>
          <p class="row-why">${esc(file.why || 'No reason recorded.')}</p>
        </div>`;
          })
          .join('')}
      </section>`,
  )
  .join('');

const verificationRows = (notes.verification ?? [])
  .map(
    (check) =>
      `<li>${chip(check.result, resultKind[check.result] ?? 'warn')} <strong>${esc(check.name)}</strong>${check.detail ? ` <span class="muted">${esc(check.detail)}</span>` : ''}</li>`,
  )
  .join('');
const reviewRows = REQUIRED_REVIEWERS[tier]
  .map((agent) => {
    const review = reviews.find((item) => item.agent === agent);
    const verdict = review?.verdict ?? 'missing';
    return `<li>${chip(verdict, OK_VERDICTS.includes(verdict) ? 'pass' : 'fail')} <strong>${esc(agent)}</strong> <span class="muted">required for ${tier}</span></li>`;
  })
  .join('');
const gapRows = (notes.gaps ?? []).map((gap) => `<li>${esc(gap)}</li>`).join('') || '<li class="muted">None recorded.</li>';
const warningRows = warnings.map((warning) => `<div class="warning">${esc(warning)}</div>`).join('');
const decisionRows = (notes.decisions ?? []).map((item) => `<li>${esc(item)}</li>`).join('');
const commitRows = commits.map((commit) => `<li><code>${esc(commit)}</code></li>`).join('') || '<li class="muted">No commits yet on this branch.</li>';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(notes.title ?? 'Change report')}</title>
<style>
:root { --primary: #2D3C59; --accent: #B7B1F2; --pink: #FDB7EA; --pass: #A3DC9A; --fail: #F08A8A; --warn: #F5C86B; --bg: #F6F5FC; --card: #FFFFFF; --text: #2D3C59; --muted-text: #6B6890; --line: #E4E1F5; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #1E2433; --card: #283046; --text: #EEF0F8; --muted-text: #A9AECB; --line: #3A4460; } }
:root[data-theme="dark"] { --bg: #1E2433; --card: #283046; --text: #EEF0F8; --muted-text: #A9AECB; --line: #3A4460; }
* { box-sizing: border-box; }
body { margin: 0; background: linear-gradient(to bottom, #B7B1F2, #FDB7EA) fixed; color: var(--text); font: 15px/1.5 'Balsamiq Sans', system-ui, sans-serif; min-height: 100vh; }
main { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; }
header, section.panel { background: var(--card); border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 14px rgba(45,60,89,.12); }
h1 { margin: 4px 0 8px; font-size: 26px; font-weight: 400; }
h2 { margin: 0 0 12px; font-size: 18px; font-weight: 400; }
h3 { margin: 0 0 6px; font-size: 15px; font-weight: 700; }
p { margin: 6px 0; }
.eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; color: var(--muted-text); margin: 0; }
.prose { white-space: pre-line; }
.muted { color: var(--muted-text); }
code { font-size: 13px; word-break: break-all; }
ul { padding-left: 18px; margin: 0; }
li { margin: 6px 0; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 14px; }
.tile { background: var(--bg); border-radius: 12px; padding: 12px; }
.tile b { display: block; font-size: 22px; font-weight: 400; }
.tier { display: inline-block; padding: 2px 12px; border-radius: 999px; background: var(--primary); color: #fff; font-weight: 700; }
.chip { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 12px; margin: 2px 4px 2px 0; background: var(--line); color: var(--text); }
.chip-pass { background: var(--pass); color: var(--primary); }
.chip-fail { background: var(--fail); color: var(--primary); }
.chip-warn { background: var(--warn); color: var(--primary); }
.chip-accent { background: var(--accent); color: var(--primary); }
.warning { background: var(--warn); color: var(--primary); border-radius: 10px; padding: 8px 12px; margin-top: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.card { background: var(--bg); border-radius: 12px; padding: 12px; border-left: 4px solid var(--pink); }
.group { margin-top: 14px; }
.row { display: grid; grid-template-columns: minmax(160px, 260px) 1fr auto; gap: 4px 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
.row-name { min-width: 0; }
.row-why { grid-column: 1 / -1; margin: 0; font-size: 13px; color: var(--muted-text); }
.bar { height: 8px; background: var(--line); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--pink)); }
.plus { color: #2E8B57; } .minus { color: #C0392B; }
@media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
<header>
  <p class="eyebrow">Change report · ${esc(branch)} vs ${esc(base)}</p>
  <h1>${esc(notes.title ?? 'Change report')}</h1>
  <p class="prose">${esc(notes.summary ?? '')}</p>
  <p><span class="tier">${esc(tier)}</span> <span class="muted">suggested from files: ${esc(suggestedTier)} · generated ${esc(new Date().toISOString())}</span></p>
  ${warningRows}
  <div class="tiles">
    <div class="tile"><b>${files.length}</b><span class="muted">files changed</span></div>
    <div class="tile"><b class="plus">+${totals.added}</b><span class="muted">lines added</span></div>
    <div class="tile"><b class="minus">-${totals.deleted}</b><span class="muted">lines deleted</span></div>
    <div class="tile"><b>${critical.length}</b><span class="muted">critical files</span></div>
    <div class="tile"><b>${commits.length}</b><span class="muted">commits</span></div>
  </div>
</header>

<section class="panel">
  <h2>Why this change</h2>
  <p class="prose">${esc(notes.why ?? 'No reasoning recorded.')}</p>
  ${decisionRows ? `<h3>Decisions</h3><ul>${decisionRows}</ul>` : ''}
</section>

<section class="panel">
  <h2>Critical files</h2>
  <div class="grid">${criticalCards}</div>
</section>

<section class="panel">
  <h2>Everything changed</h2>
  ${folderSections || '<p class="muted">No file changes against the base.</p>'}
</section>

<section class="panel">
  <h2>Verification</h2>
  <ul>${verificationRows || '<li class="muted">No checks recorded.</li>'}</ul>
  <h3>Reviews</h3>
  <ul>${reviewRows}</ul>
</section>

<section class="panel">
  <h2>Not verified and known gaps</h2>
  <ul>${gapRows}</ul>
</section>

<section class="panel">
  <h2>Commits on this branch</h2>
  <ul>${commitRows}</ul>
</section>
</main>
</body>
</html>
`;

const outDir = join(root, 'e2e-artifacts', 'change-report');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'index.html');
writeFileSync(outFile, html);
console.log(outFile);
