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
const { settings } = JSON.parse(readFileSync(expectedFile, 'utf8'));

const res = await fetch(`https://api.github.com/repos/${repo}`, {
  headers: {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'into-the-coil-settings-drift',
  },
});
if (!res.ok) throw new Error(`settings-drift: GET /repos/${repo} returned ${res.status} ${res.statusText}`);
const live = await res.json();

const drifted = [];
const unreadable = [];

for (const [key, { value: want, why }] of Object.entries(settings)) {
  if (!(key in live)) {
    unreadable.push(key);
    continue;
  }
  if (live[key] !== want) drifted.push({ key, want, got: live[key], why });
}

if (unreadable.length) {
  throw new Error(
    `settings-drift: the API response carries no value for ${unreadable.join(', ')} — ` +
      'the token probably lacks the scope to read it. Unverifiable is not the same as correct.',
  );
}

const lines = [`## Settings drift — \`${repo}\``, ''];
if (drifted.length === 0) {
  lines.push(`All ${Object.keys(settings).length} decided settings match. Read back, not assumed.`);
} else {
  lines.push('| setting | decided | live | why it was decided |', '|---|---|---|---|');
  for (const { key, want, got, why } of drifted) {
    lines.push(`| \`${key}\` | \`${want}\` | \`${got}\` | ${why} |`);
  }
}
process.stdout.write(lines.join('\n') + '\n');

// Non-zero on drift so the workflow step fails visibly, rather than leaving it to whoever reads
// the summary.
if (drifted.length) process.exitCode = 1;
