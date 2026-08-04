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

const base = { isCurrent: false, mergedPr: null, mergedSha: null, localSha: 'a'.repeat(40), identical: false, ahead: 0 };

describe('tidy only deletes what it can prove is safe', () => {
  it('never touches main, whatever the evidence says', () => {
    expect(classify('main', { ...base, mergedPr: 7, identical: true }).remove).toBe(false);
  });

  it('never touches the branch that is checked out', () => {
    expect(classify('feature', { ...base, isCurrent: true, mergedPr: 7 }).remove).toBe(false);
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

  it('deletes a branch whose tree is identical to main even with no PR', () => {
    expect(classify('feature', { ...base, identical: true }).remove).toBe(true);
  });

  it('keeps a branch with commits of its own and no merged PR, and says how many', () => {
    const v = classify('feature', { ...base, ahead: 2 });
    expect(v.remove).toBe(false);
    expect(v.reason).toContain('2 commits');
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
