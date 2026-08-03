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
const { settings, protection, rulesets } = JSON.parse(readFileSync(expectedFile, 'utf8'));

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

// ---- rulesets --------------------------------------------------------------------------------

/**
 * The SECOND system stating branch policy. Both it and classic protection apply, most restrictive
 * winning — so a change made here is invisible to a check reading only the protection endpoint.
 * That is the same blind spot this script was extended to close, reopened in a different API.
 */
const rulesetNames = Object.keys(rulesets ?? {}).filter((k) => !k.startsWith('$'));

/**
 * Every assertion made about one ruleset, named. Used BOTH for the skip list and the "N of M"
 * denominator — they were computed separately once and disagreed, so the report claimed to have
 * checked four things it had not even looked at.
 */
const rulesetCheckKeys = (name) => {
  const want = rulesets[name];
  const keys = [`ruleset[${name}].enforcement`, `ruleset[${name}].bypass_actor_count`, `ruleset[${name}].rule_types`];
  for (const [ruleType, fields] of Object.entries(want)) {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) continue;
    for (const field of Object.keys(fields)) keys.push(`ruleset[${name}].${ruleType}.${field}`);
  }
  return keys;
};

if (rulesetNames.length && !adminToken) {
  skipped.push(...rulesetNames.flatMap(rulesetCheckKeys));
} else if (rulesetNames.length) {
  const index = await api(`/repos/${repo}/rulesets`, adminToken);
  for (const name of rulesetNames) {
    const want = rulesets[name];
    const found = index.find((r) => r.name === name);
    if (!found) {
      drifted.push({ key: `ruleset[${name}]`, want: 'present', got: 'missing', why: want.why });
      continue;
    }
    const full = await api(`/repos/${repo}/rulesets/${found.id}`, adminToken);
    const types = full.rules.map((r) => r.type).sort();

    const cmp = (key, got, expected, why) => {
      if (!same(got, expected)) drifted.push({ key: `ruleset[${name}].${key}`, want: expected, got, why });
    };

    cmp('enforcement', full.enforcement, want.enforcement, want.why);
    cmp('bypass_actor_count', (full.bypass_actors ?? []).length, want.bypass_actor_count,
      'A bypass actor is an exemption, and an exemption nobody remembers granting is how protection becomes decorative.');
    cmp('rule_types', types, [...want.rule_types].sort(), want.why);

    for (const [ruleType, fields] of Object.entries(want)) {
      if (typeof fields !== 'object' || Array.isArray(fields) || !types.includes(ruleType)) continue;
      const params = full.rules.find((r) => r.type === ruleType)?.parameters ?? {};
      for (const [field, { value, why }] of Object.entries(fields)) {
        if (!(field in params)) {
          unreadable.push(`ruleset[${name}].${ruleType}.${field}`);
          continue;
        }
        cmp(`${ruleType}.${field}`, params[field], value, why);
      }
    }
  }
}

// ---- report --------------------------------------------------------------------------------

if (unreadable.length) {
  // Name the fix, not just the symptom. GitHub does not error on an under-scoped token here — it
  // silently OMITS the fields, so the failure looks like a bug in this script rather than a
  // permissions problem, and the first person to hit it will go looking in the wrong place.
  // DIAGNOSTICS, not just a complaint. GitHub does not reject an under-scoped token here — it
  // silently omits the fields — so the failure reads as a bug in this script. `permissions` says
  // outright what the token is treated as having, which is the one fact needed to fix it and the
  // one nobody can see from the outside.
  const perms = live.permissions ?? {};
  const present = Object.keys(live).filter((k) => k.startsWith('allow_') || k === 'delete_branch_on_merge');
  const diagnosis = [
    `The token is seen by GitHub as: ${JSON.stringify(perms)}`,
    `The response carried ${Object.keys(live).length} fields, of which these are settings fields: ` +
      `${present.length ? present.join(', ') : '(none)'}`,
    '',
    perms.admin
      ? '⚠️ The token HAS admin and the fields are STILL absent, so this is not about repository ' +
        'access level. Measured 2026-08-03: a FINE-GRAINED PAT with Administration: read reports ' +
        '`admin: true` here and yet omits every merge setting, while a classic/OAuth token with ' +
        '`repo` surfaces all of them. If the secret holds a fine-grained token, try Administration: ' +
        'READ AND WRITE; if that still omits them, the endpoint does not serve these fields to ' +
        'fine-grained tokens at all and a classic PAT with `repo` is the only option.'
      : '⚠️ `admin: false` — the token has no admin access to the repository, which is the ' +
        'straightforward case. Grant it, or use a classic PAT with the `repo` scope.',
  ].join('\n');

  const hint = adminToken
    ? diagnosis
    : 'No SETTINGS_READ_TOKEN is set, and these are not marked `"admin": true` in ' +
      '.github/expected-settings.json — mark them, or supply a token that can read them.';

  throw new Error(
    `settings-drift: the API response carries no value for ${unreadable.join(', ')}.\n\n${hint}\n\n` +
      'Unverifiable is not the same as correct, which is why this fails rather than passing quietly.',
  );
}

const show = (v) => `\`${Array.isArray(v) ? JSON.stringify(v) : v}\``;
const total =
  Object.keys(settings).length +
  Object.keys(protection?.expect ?? {}).length +
  rulesetNames.flatMap(rulesetCheckKeys).length;

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
    `**NOT CHECKED — ${skipped.length} of ${total} settings.** The built-in workflow token cannot ` +
      'read these: the merge flags are omitted from the repository response, and branch protection ' +
      'and rulesets both return 403. They need a `SETTINGS_READ_TOKEN` secret. Until then they are ' +
      'taken on trust:',
    '',
    skipped.map((k) => `- \`${k}\``).join('\n'),
  );
}

process.stdout.write(lines.join('\n') + '\n');

// Non-zero on drift so the workflow step fails visibly, rather than leaving it to whoever reads
// the summary. NOT non-zero on `skipped` — a job that is red for a reason nobody intends to fix
// gets switched off, taking the settings it CAN check down with it.
if (drifted.length) process.exitCode = 1;
