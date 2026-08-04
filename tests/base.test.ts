import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
// A plain .mjs script, deliberately: it is a CLI the workflow runs,
// not a module `src/` imports. Typing it would mean a build step for something node runs directly.
import { baseProblem, BASE } from '../scripts/check-base.mjs';

/**
 * A BRANCH STARTS AT `main`.
 *
 * See `docs/decisions/0033-a-branch-starts-at-main.md`.
 *
 * ⚠️ **This guard protects against a failure no test can reproduce**, which is exactly why the logic
 * lives in `scripts/check-base.mjs` rather than in a line of workflow YAML. The thing being prevented
 * happens on GitHub, to a branch, after a merge. What CAN be driven here is the decision the script
 * makes, and whether the workflow actually calls it — so both are.
 *
 * The second half is the one that rots. A perfect script nobody runs is the shape
 * `scripts/verify-deploy.mjs` was in when it went stale: correct, and describing a fact it had
 * stopped being told about.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

describe('a pull request targets main, and nothing else', () => {
  it('accepts main', () => {
    expect(baseProblem('main')).toBeNull();
  });

  it('THE ONE: refuses a base that is another branch — the stacked PR', () => {
    const problem = baseProblem('ship-moves');
    expect(problem, 'a PR stacked on an unmerged branch was allowed through').not.toBeNull();
    expect(problem).toContain('ship-moves');
  });

  it('says what to do about it, because a refusal with no next step is a wall', () => {
    const problem = baseProblem('landscape-is-shipped') ?? '';
    expect(problem, 'the message does not tell you how to fix it').toContain('git rebase origin/main');
    expect(problem, 'the message does not name the decision behind it').toContain('0033');
  });

  it('names the mechanism rather than just the rule', () => {
    // Squash plus delete-on-merge is WHY stacking is fatal here rather than merely untidy. A
    // refusal that does not say so reads as a style preference and gets argued with.
    const problem = baseProblem('anything') ?? '';
    expect(problem).toContain('delete_branch_on_merge');
  });

  it('ignores an empty base, which is every run that is not a pull request', () => {
    // `workflow_dispatch` and `workflow_call` reach the same job and have no base ref. Failing
    // those would block the release path, which is a far worse bug than the one being fixed.
    expect(baseProblem('')).toBeNull();
    expect(baseProblem(undefined)).toBeNull();
    expect(baseProblem('   ')).toBeNull();
  });

  it('tolerates the whitespace a YAML expression can leave behind', () => {
    expect(baseProblem('  main  ')).toBeNull();
  });

  it('has one spelling of the base branch', () => {
    expect(BASE).toBe('main');
  });
});

describe('the workflow actually runs the check', () => {
  const workflow = readFileSync(resolve(root, '.github/workflows/tests.yml'), 'utf8');

  it('calls scripts/check-base.mjs from the required job', () => {
    expect(workflow, 'the guard exists but nothing runs it').toContain('node scripts/check-base.mjs');
  });

  it('passes the pull request’s base ref to it', () => {
    expect(workflow).toMatch(/check-base\.mjs\s+"\$\{\{\s*github\.event\.pull_request\.base\.ref\s*\}\}"/);
  });

  it('THE ORDERING ONE: runs it before npm ci, so a stacked PR fails in seconds', () => {
    const check = workflow.indexOf('node scripts/check-base.mjs');
    // The RUN STEP, not the phrase — the comment above the check says "before `npm ci`", and matching
    // that instead put the install before the check and failed this test on its first run.
    const install = workflow.indexOf('- run: npm ci');
    expect(check, 'the check is not in the workflow at all').toBeGreaterThan(-1);
    expect(install, 'the npm ci step is not in the workflow at all').toBeGreaterThan(-1);
    expect(check, 'the check runs after the install, which wastes the CI cycle it exists to save').toBeLessThan(
      install,
    );
  });

  it('lives in the REQUIRED job, because an unrequired check is one nobody is blocked by', () => {
    // The required context is the job key `test`. A check in a job of its own would need a settings
    // change to become required, and until it did it would be advisory — which is how a guard rots.
    const job = workflow.slice(workflow.indexOf('  test:'));
    expect(job).toContain('node scripts/check-base.mjs');
  });
});
