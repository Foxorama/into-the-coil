import { describe, it, expect } from 'vitest';
import { classify } from '../scripts/tidy.mjs';

/**
 * THE ONE DECISION IN `scripts/tidy.mjs` THAT CAN DESTROY WORK.
 *
 * Everything else the script does is recoverable or read-only. `classify` is what stands between
 * "the branch was merged" and "the branch is gone and nobody knows what was on it", which is the
 * same reason `tests/prove-guard.test.ts` unit-tests `planEdit` rather than trusting it.
 *
 * The cases below are the ones that are WRONG under the obvious implementations:
 *
 *   - `git branch -d` refuses a squash-merged branch, because the squash commit shares no sha with
 *     it. Trusting git here means the tool never deletes anything and stops being used.
 *   - Trusting the merged PR alone destroys commits pushed to the branch AFTER the merge.
 */

const base = { isCurrent: false, worktree: null, mergedPr: null, mergedSha: null, localSha: 'a'.repeat(40), identical: false, ahead: 0 };

describe('tidy only deletes what it can prove is safe', () => {
  it('never touches main, whatever the evidence says', () => {
    expect(classify('main', { ...base, mergedPr: 7, identical: true }).remove).toBe(false);
  });

  it('never touches the branch that is checked out', () => {
    expect(classify('feature', { ...base, isCurrent: true, mergedPr: 7 }).remove).toBe(false);
  });

  /*
    ⚠️ **THE CASE THAT MADE THE TOOL UNRUNNABLE HERE, AND IT WAS NOT A NEAR MISS** — 0271's own
    tidy pass. `isCurrent` is ONE checkout; this repository has twenty-seven worktrees, and
    twenty-four of them stand on branches whose PRs are merged. git refuses to delete a branch a
    worktree holds, so the run died on the second branch it examined and deleted none of the
    thirty-nine it could have.

    ⚠️ **IT IS A KEEP AND NOT A FORCE.** A worktree on a merged branch is still somebody's checkout —
    `docs/decisions/0200-the-tool-that-edits-must-not-lose-what-it-edits.md` — and the merge proves
    nothing about whether a session is standing in it. Removing the worktree stops for an answer,
    which a script cannot ask for.
  */
  it('KEEPS a merged branch a LINKED worktree is standing on, and names the path', () => {
    const v = classify('feature', { ...base, worktree: 'C:/into-the-coil-boss', mergedPr: 7, mergedSha: base.localSha });
    expect(v.remove).toBe(false);
    expect(v.reason).toContain('C:/into-the-coil-boss');
  });

  it('deletes a squash-merged branch, which is the case git itself refuses', () => {
    const v = classify('feature', { ...base, mergedPr: 24, mergedSha: 'a'.repeat(40), ahead: 3 });
    expect(v.remove).toBe(true);
    expect(v.reason).toContain('#24');
  });

  it('KEEPS a merged branch that has moved since the merge — the case that would lose work', () => {
    // THE case. The PR says merged; the branch says something else is on it now.
    const v = classify('feature', { ...base, mergedPr: 24, mergedSha: 'b'.repeat(40), localSha: 'c'.repeat(40) });
    expect(v.remove).toBe(false);
    expect(v.reason).toMatch(/but the branch is now at/);
  });

  /*
    ⚠️ **`ahead: 3` IS LOAD-BEARING AND THIS CASE READ `ahead: 0` UNTIL THE PROBE SAID SO.** The
    fixture's default made this indistinguishable from *every commit is on main*, so when that rule
    was added the probe for THIS one reported STILL GREEN — the guard passing on a path it does not
    name. `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` catching a guard that had stopped
    reaching its subject, on the same run that added the rule which took it away.

    ⚠️ **AND THE ISOLATED CASE IS THE REAL ONE**: a branch that added a thing and reverted it has
    commits of its own AND a tree that matches main, which is the only shape `identical` decides
    alone.
  */
  it('deletes a branch whose tree is identical to main even with no PR', () => {
    expect(classify('feature', { ...base, identical: true, ahead: 3 }).remove).toBe(true);
  });

  it('keeps a branch with commits of its own and no merged PR, and says how many', () => {
    const v = classify('feature', { ...base, ahead: 2 });
    expect(v.remove).toBe(false);
    expect(v.reason).toContain('2 commits');
  });

  /*
    ⚠️ **THE TOOL STATED THE PROOF AND THEN DECLINED TO ACT ON IT.** Three branches were kept with
    the reason *"0 commits not on main, and no merged PR"* — pointing seventy to a hundred and
    nineteen commits behind it, so their TREES differ from main's and `identical` is false while
    every commit they carry is already there. `ahead === 0` is the condition `git branch -d` itself
    accepts, and it is stronger evidence than the PR: it is about this repository rather than about a
    remote's record of one.
  */
  it('deletes a branch whose every commit is on main, even with no PR and a different tree', () => {
    const v = classify('feature', { ...base, ahead: 0, identical: false });
    expect(v.remove).toBe(true);
    expect(v.reason).toContain('every commit is on main');
  });

  it('every verdict carries a reason, because an unexplained deletion is unreviewable', () => {
    const cases = [
      ['main', base],
      ['feature', { ...base, isCurrent: true }],
      ['feature', { ...base, mergedPr: 1, mergedSha: base.localSha }],
      ['feature', { ...base, identical: true }],
      ['feature', { ...base, ahead: 5 }],
    ] as const;
    for (const [name, facts] of cases) expect(classify(name, facts).reason.length).toBeGreaterThan(8);
  });
});
