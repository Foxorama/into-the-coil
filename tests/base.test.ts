import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
// A plain .mjs script, deliberately: it is a CLI the workflow runs,
// not a module `src/` imports. Typing it would mean a build step for something node runs directly.
import { baseProblem, pileUpProblem, BASE } from '../scripts/check-base.mjs';

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

describe('and the next branch waits, which is 0033’s other half', () => {
  /**
   * ⚠️ **THIS IS THE HALF THAT WAS ENFORCED BY MEMORY, AND MEMORY LOST.** 0033 is titled *"A branch
   * starts at `main`, and the next one waits"*, and until now only the first clause was checked —
   * four PRs open at once are four PRs based on `main`, and every one of them passed.
   * `docs/decisions/0075-the-serialisation-is-checked.md`.
   */
  it('accepts the healthy state, which is exactly one', () => {
    expect(pileUpProblem(1)).toBeNull();
    expect(pileUpProblem('1')).toBeNull();
  });

  it('THE ONE: refuses a second pull request in flight', () => {
    const problem = pileUpProblem(2);
    expect(problem, 'a second PR was allowed to be open alongside the first').not.toBeNull();
    expect(problem).toContain('2 pull requests open');
  });

  it('says what the cost actually is, because "poor form" is a preference and this is not', () => {
    /*
      The failures that arrived were not merge conflicts — they were documents citing each other as
      *"this becomes a link once that merges"*, a handover nobody could edit, and previews holding
      half the game each. A refusal that does not name them reads as tidiness.
    */
    const problem = pileUpProblem(4) ?? '';
    expect(problem, 'the message does not say what to do').toContain('Land the older one first');
    expect(problem, 'the message does not name the decision behind it').toContain('0033');
  });

  it('ignores a count it could not obtain, because advisory infrastructure may not fail a PR', () => {
    // `gh` failing, a token without the scope, an API blip. None of those are a reason to block a
    // change, and a guard that fails open here is the difference between a check and an outage.
    expect(pileUpProblem('')).toBeNull();
    expect(pileUpProblem(undefined)).toBeNull();
    expect(pileUpProblem('not a number')).toBeNull();
    expect(pileUpProblem(0), 'zero is what a non-PR run reports, and it is not a pile-up').toBeNull();
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

  it('and passes it how many pull requests are open, which is 0033’s other half', () => {
    /*
      ⚠️ **The half that rots**, exactly as this file's header warns: a perfect `pileUpProblem` that
      the workflow never calls is a guard describing a fact it has stopped being told about. The
      count comes from `gh`, which is on every runner, with the job's own token.
    */
    expect(workflow, 'the count is never obtained').toContain("gh pr list --state open --json number --jq 'length'");
    expect(workflow, 'the count is obtained and not handed to the script').toMatch(/check-base\.mjs\s+"[^"]*"\s+"\$open"/);
    expect(workflow, 'a failed API call would fail the PR rather than being ignored').toContain('|| echo ""');
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
