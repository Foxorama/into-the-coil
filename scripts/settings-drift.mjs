// Read the repository's admin settings back and report anything that has drifted from what this
// project decided (docs/decisions/0004-admin-settings-must-be-read-back.md).
//
// WHY THIS EXISTS. Of the ten incidents behind this project's scaffold plan, four never passed
// through a pull request at all — they were settings ticked in a web UI. No test, review or
// PR-level instrument can see them; they are invisible to git and will be silently absent. One of
// them served raw source as the production site and cost a long hunt in which every code fix was
// correct but none of them touched the file actually being served.
//
// ⚠️ A MISSING FIELD IS A FAILURE, NOT A PASS. If the API response does not carry a key we expect,
// this exits non-zero rather than reporting "no drift" — a token without the scope to see a setting
// must not look like a setting that is correct. That distinction is the entire value of the job.
//
// Usage: node scripts/settings-drift.mjs <owner/repo>    (GH_TOKEN or GITHUB_TOKEN in the env)

import { readFileSync } from 'node:fs';

const repo = process.argv[2] ?? process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
if (!repo) throw new Error('settings-drift: no repository given (argv[2] or GITHUB_REPOSITORY)');
if (!token) throw new Error('settings-drift: no GH_TOKEN / GITHUB_TOKEN in the environment');

const expectedFile = new URL('../.github/expected-settings.json', import.meta.url);
const { settings, protection } = JSON.parse(readFileSync(expectedFile, 'utf8'));

const api = async (path, as = token) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      authorization: `Bearer ${as}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'into-the-coil-settings-drift',
    },
  });
  if (!res.ok) throw new Error(`settings-drift: GET ${path} returned ${res.status} ${res.statusText}`);
  return res.json();
};

const live = await api(`/repos/${repo}`);

const drifted = [];
const unreadable = [];

for (const [key, { value: want, why }] of Object.entries(settings)) {
  if (!(key in live)) {
    unreadable.push(key);
    continue;
  }
  if (live[key] !== want) drifted.push({ key, want, got: live[key], why });
}

/**
 * Branch protection, which lives on a DIFFERENT endpoint and needs `administration: read`.
 *
 * Added because everything configured on 2026-08-03 — the required `test` check, the PR
 * requirement, `enforce_admins` — sat outside the only guard built to notice settings drift. And
 * one of them had already been wrong: `enforce_admins: false` left protection reporting correct in
 * every settings screen while stopping nothing, because the sole developer was exempt from it.
 * That is the failure this whole script exists for, and it was in the script's blind spot.
 */
const shape = (v) => (v && typeof v === 'object' && 'enabled' in v ? v.enabled : v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * ⚠️ THE BUILT-IN WORKFLOW TOKEN CANNOT READ THIS. Measured, not assumed:
 * `GET /branches/main/protection` returns **403** under `github.token`, and there is no
 * `permissions:` key that grants it — `administration` is not a valid workflow permission (a
 * workflow declaring it fails to parse). Reading protection needs a token with admin scope.
 *
 * So this half is opt-in on `SETTINGS_PROTECTION_TOKEN`, a fine-grained PAT with
 * *Administration: read* on this repo alone. Present → protection is checked and any problem is a
 * hard failure. Absent → the report says NOT CHECKED, in those words, every week.
 *
 * The alternative — fail weekly until someone mints a PAT — was rejected: a job that is red for a
 * reason nobody intends to fix gets switched off, and takes the eight repository settings it *can*
 * check down with it. A gap that announces itself is worth more than a guard nobody runs.
 */
const protectionToken = process.env.SETTINGS_PROTECTION_TOKEN;
let protectionNote = null;

if (protection && !protectionToken) {
  protectionNote =
    '**Branch protection: NOT CHECKED.** The built-in workflow token gets 403 on the protection ' +
    'endpoint and no `permissions:` key can grant it. To cover it, add a fine-grained PAT with ' +
    '*Administration: read* as the `SETTINGS_PROTECTION_TOKEN` secret. Until then these are read ' +
    'back by hand: ' +
    Object.keys(protection.expect)
      .map((k) => `\`${k}\``)
      .join(', ') +
    '.';
}

if (protection && protectionToken) {
  const p = await api(`/repos/${repo}/branches/${protection.branch}/protection`, protectionToken);
  const actual = {
    required_status_checks: p.required_status_checks?.contexts ?? null,
    strict: p.required_status_checks?.strict ?? null,
    requires_pull_request: p.required_pull_request_reviews != null,
    enforce_admins: shape(p.enforce_admins),
    allow_force_pushes: shape(p.allow_force_pushes),
    allow_deletions: shape(p.allow_deletions),
  };
  for (const [key, { value: want, why }] of Object.entries(protection.expect)) {
    const got = actual[key];
    if (got === null || got === undefined) {
      unreadable.push(`protection.${key}`);
      continue;
    }
    if (!same(got, want)) drifted.push({ key: `protection.${key}`, want, got, why });
  }
}

if (unreadable.length) {
  throw new Error(
    `settings-drift: the API response carries no value for ${unreadable.join(', ')} — ` +
      'the token probably lacks the scope to read it. Unverifiable is not the same as correct.',
  );
}

const checked = Object.keys(settings).length + (protectionToken ? Object.keys(protection?.expect ?? {}).length : 0);
const show = (v) => `\`${Array.isArray(v) ? JSON.stringify(v) : v}\``;

const lines = [`## Settings drift — \`${repo}\``, ''];
if (drifted.length === 0) {
  lines.push(
    `All ${checked} decided settings match${protectionToken ? ', repository and branch protection' : ''}. ` +
      'Read back, not assumed.',
  );
} else {
  lines.push('| setting | decided | live | why it was decided |', '|---|---|---|---|');
  for (const { key, want, got, why } of drifted) {
    lines.push(`| \`${key}\` | ${show(want)} | ${show(got)} | ${why} |`);
  }
}
if (protectionNote) lines.push('', protectionNote);

process.stdout.write(lines.join('\n') + '\n');

// Non-zero on drift so the workflow step fails visibly, rather than leaving it to whoever reads
// the summary.
if (drifted.length) process.exitCode = 1;
