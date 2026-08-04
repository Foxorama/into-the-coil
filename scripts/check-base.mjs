// A PR's base is `main`. Never another branch.
//
// See docs/decisions/0033-a-branch-starts-at-main.md.
//
// ⚠️ A SCRIPT RATHER THAN A LINE OF YAML, and that is the whole reason this file exists. A condition
// written inline in `.github/workflows/tests.yml` cannot be broken on purpose and watched to go red
// — `npm run prove` can edit a file and run a vitest suite, and it can do nothing whatever about a
// step that only runs on GitHub. docs/decisions/0005-a-guard-must-be-seen-to-fail.md says a guard
// that has only ever been green is not known to work, and a guard the harness cannot reach is
// permanently in that state. Same shape as scripts/verify-deploy.mjs for the same reason.
//
// ⚠️ IT RUNS FIRST IN THE JOB, before `npm ci`. A stacked PR is a mechanical mistake that costs
// nothing to detect and about four minutes to detect late; failing in five seconds is the difference
// between a nuisance and a wasted CI cycle.

import { pathToFileURL } from 'node:url';

/** The one branch a pull request may target. */
export const BASE = 'main';

/**
 * Decide whether a base ref is allowed, and say why when it is not.
 *
 * Returns `null` when the base is fine, and the message to print when it is not. Split from the
 * process-exiting half so a test can drive it — the failure mode being guarded against is one that
 * only occurs on a machine no test runs on.
 *
 * `base` is whatever `github.event.pull_request.base.ref` gave us: a bare branch name, never a full
 * ref. An empty value means the workflow ran outside a pull request, which is not this check's
 * business — `workflow_dispatch` and `workflow_call` both reach the same job.
 */
export function baseProblem(base) {
  if (typeof base !== 'string' || base.trim() === '') return null;
  const ref = base.trim();
  if (ref === BASE) return null;

  return [
    `This PR targets \`${ref}\`, and a PR's base is \`${BASE}\`.`,
    '',
    'This repository squash-merges with `delete_branch_on_merge`. A branch based on another open',
    "PR is orphaned the instant that PR lands — its base's history is rewritten into one commit and",
    'the branch itself is deleted, which closes the stacked PR outright. Every stacked branch in the',
    'session that produced this rule failed that way, and no branch based on `main` did.',
    '',
    'Rebase onto `main` and retarget:',
    '',
    `    git fetch origin && git rebase origin/${BASE}`,
    '',
    'If the work genuinely depends on an unmerged PR, land that one first. Waiting is cheaper than',
    'the recovery — see docs/decisions/0033-a-branch-starts-at-main.md.',
  ].join('\n');
}

// @setup: the CLI half, and it must not run when a test imports this file. Compared as URLs rather
// than as paths because on Windows `process.argv[1]` is a backslashed drive path and
// `import.meta.url` is a `file://` URL — a string compare of the two never matches, and a filename
// compare matches any file with the same basename.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problem = baseProblem(process.argv[2]);
  if (problem !== null) {
    console.error(problem);
    process.exit(1);
  }
  console.log(`base is \`${BASE}\``);
}
