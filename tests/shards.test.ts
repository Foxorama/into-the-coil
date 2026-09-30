import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { jobsOf } from './jobs.ts';

/**
 * THE REQUIRED CHECK IS A JOIN, AND A JOIN THAT DOES NOT RUN IS A PASS.
 *
 * `docs/decisions/0420-the-ci-is-sharded-and-joined.md`. The suite and the probes are dealt across
 * runner jobs, and the context branch protection requires — the job key `test` — waits for all of
 * them and reads what they did. Everything below is a way that job could report success over work
 * that failed, and none of them would ever show as a red run: they show as a green one.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const workflow = readFileSync(resolve(root, '.github/workflows/tests.yml'), 'utf8');
const jobs = jobsOf(workflow);
const required = jobs.find((job) => job.key === 'test');

describe('0420 — the required job joins every other job, whatever they did', () => {
  it('there is a `test` job, and it is not the only one', () => {
    expect(required, 'no `test` job, which is the context branch protection requires').toBeDefined();
    expect(jobs.length, 'the workflow is one job, so this file is reading the wrong shape').toBeGreaterThan(1);
  });

  it('THE TRAP: it always runs, because GitHub reports a SKIPPED required check as passing', () => {
    /*
      A job whose dependency failed is skipped unless it says otherwise, and a skipped required check
      satisfies branch protection. So one red shard would merge. `!cancelled()` is not enough: a
      cancelled run would skip it too, and the PR's head would read green.
    */
    expect(required?.condition, 'the required job can be skipped, and skipped reads as green').toBe('always()');
  });

  it('and it waits on every other job, because one it does not wait on can fail unheard', () => {
    const others = jobs.filter((job) => job.key !== 'test').map((job) => job.key);
    expect([...(required?.needs ?? [])].sort()).toEqual([...others].sort());
  });

  it('and it JOINS them: the verdict is read from every job, not assumed from its own', () => {
    /*
      `always()` makes the job run; this is what makes running mean something. The join reads every
      dependency's result, every seal, every report and every probe shard's result — `joinProblems`
      in `scripts/prove-guard.mjs`, held by `tests/prove-guard.test.ts`.
    */
    expect(required?.body, 'the required job does not run the join').toContain('node scripts/prove-guard.mjs --join');
    expect(required?.body, 'the join is not handed what the jobs did').toMatch(/NEEDS:\s*\$\{\{\s*toJSON\(needs\)\s*\}\}/);
  });
});
