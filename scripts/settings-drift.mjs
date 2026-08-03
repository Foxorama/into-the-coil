// Read the repository's admin settings back and report anything that has drifted from what this
// project decided (docs/decisions/0004-admin-settings-must-be-read-back.md).
//
// WHY THIS EXISTS. Of the ten incidents behind this project's scaffold plan, four never passed
// through a pull request at all — they were settings ticked in a web UI. No test, review or
// PR-level instrument can see them; they are invisible to git and will be silently absent. One of
// them served raw source as the production site and cost a long hunt in which every code fix was
// correct but none of them touched the file actually being served.
//
// ⚠️ MOST OF THESE SETTINGS NEED AN ADMIN TOKEN, AND THE BUILT-IN WORKFLOW TOKEN IS NOT ONE.
// Measured on CI, not assumed: under `github.token`, `GET /repos/{owner}/{repo}` simply OMITS
// `allow_auto_merge`, `delete_branch_on_merge` and all three merge-method flags, and
// `GET /branches/{b}/protection` returns 403. There is no `permissions:` key that fixes it —
// `administration` is not valid in a workflow and a file declaring it fails to parse.
//
// So the useful half is opt-in on `SETTINGS_READ_TOKEN`: a fine-grained PAT with
// *Administration: read* on this repo alone. Present → everything is checked and any problem is a
// hard failure. Absent → the report names, in those words, exactly what is NOT CHECKED.
//
// ⚠️ A MISSING FIELD IS A FAILURE, NOT A PASS. Where we have the scope to read a setting and the
// value is absent anyway, this exits non-zero rather than reporting no drift. A token that cannot
// see a setting must never be mistaken for a setting that is correct.
//
// Usage: node scripts/settings-drift.mjs <owner/repo>

import { readFileSync } from 'node:fs';

const repo = process.argv[2] ?? process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const adminToken = process.env.SETTINGS_READ_TOKEN || null;
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

const drifted = [];
const unreadable = [];
const skipped = [];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unwrap = (v) => (v && typeof v === 'object' && 'enabled' in v ? v.enabled : v);

// ---- repository settings -------------------------------------------------------------------

const live = await api(`/repos/${repo}`, adminToken ?? token);

for (const [key, { value: want, why, admin }] of Object.entries(settings)) {
  if (admin && !adminToken) {
    skipped.push(key);
    continue;
  }
  if (!(key in live)) {
    unreadable.push(key);
    continue;
  }
  if (!same(live[key], want)) drifted.push({ key, want, got: live[key], why });
}

// ---- branch protection ---------------------------------------------------------------------

if (protection && !adminToken) {
  skipped.push(...Object.keys(protection.expect).map((k) => `protection.${k}`));
} else if (protection) {
  const p = await api(`/repos/${repo}/branches/${protection.branch}/protection`, adminToken);
  const actual = {
    required_status_checks: p.required_status_checks?.contexts,
    strict: p.required_status_checks?.strict,
    requires_pull_request: p.required_pull_request_reviews != null,
    enforce_admins: unwrap(p.enforce_admins),
    allow_force_pushes: unwrap(p.allow_force_pushes),
    allow_deletions: unwrap(p.allow_deletions),
  };
  for (const [key, { value: want, why }] of Object.entries(protection.expect)) {
    const got = actual[key];
    if (got === undefined) {
      unreadable.push(`protection.${key}`);
      continue;
    }
    if (!same(got, want)) drifted.push({ key: `protection.${key}`, want, got, why });
  }
}

// ---- report --------------------------------------------------------------------------------

if (unreadable.length) {
  // Name the fix, not just the symptom. GitHub does not error on an under-scoped token here — it
  // silently OMITS the fields, so the failure looks like a bug in this script rather than a
  // permissions problem, and the first person to hit it will go looking in the wrong place.
  const hint = adminToken
    ? 'A SETTINGS_READ_TOKEN is set, but it does not surface these. GitHub returns them only to a ' +
      'token with admin rights on the repository: a FINE-GRAINED PAT needs Repository permissions ' +
      '-> Administration: read (Metadata: read is added automatically), and must list this repo ' +
      'under "Only select repositories". A CLASSIC PAT needs the `repo` scope. Check which kind ' +
      'the secret holds before re-running.'
    : 'No SETTINGS_READ_TOKEN is set, and these are not marked `"admin": true` in ' +
      '.github/expected-settings.json — mark them, or supply a token that can read them.';
  throw new Error(
    `settings-drift: the API response carries no value for ${unreadable.join(', ')}.\n\n${hint}\n\n` +
      'Unverifiable is not the same as correct, which is why this fails rather than passing quietly.',
  );
}

const show = (v) => `\`${Array.isArray(v) ? JSON.stringify(v) : v}\``;
const total = Object.keys(settings).length + Object.keys(protection?.expect ?? {}).length;

const lines = [`## Settings drift — \`${repo}\``, ''];

if (drifted.length === 0) {
  lines.push(`${total - skipped.length} of ${total} decided settings match. Read back, not assumed.`);
} else {
  lines.push('| setting | decided | live | why it was decided |', '|---|---|---|---|');
  for (const { key, want, got, why } of drifted) {
    lines.push(`| \`${key}\` | ${show(want)} | ${show(got)} | ${why} |`);
  }
}

if (skipped.length) {
  lines.push(
    '',
    `**NOT CHECKED — ${skipped.length} settings.** The built-in workflow token cannot read these: ` +
      'the merge flags are omitted from the repository response and branch protection returns 403. ' +
      'Add a fine-grained PAT with *Administration: read* as the `SETTINGS_READ_TOKEN` secret to ' +
      'cover them. Until then they are taken on trust:',
    '',
    skipped.map((k) => `- \`${k}\``).join('\n'),
  );
}

process.stdout.write(lines.join('\n') + '\n');

// Non-zero on drift so the workflow step fails visibly, rather than leaving it to whoever reads
// the summary. NOT non-zero on `skipped` — a job that is red for a reason nobody intends to fix
// gets switched off, taking the settings it CAN check down with it.
if (drifted.length) process.exitCode = 1;
