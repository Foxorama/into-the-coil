import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isAVerdict, linkModules, startWarm, verdictOf, warmSettles } from '../scripts/prove-guard.mjs';
import { asModulePath, unflushed } from '../scripts/prove-worker.mjs';

/**
 * 0344 — A PROBE RUNS IN A VITEST THAT IS ALREADY UP, AND THE ONLY NEW WAY TO BE WRONG IS A STALE MODULE.
 *
 * See `docs/decisions/0344-a-probe-runs-warm.md`. What is held here is the two directions a live
 * instance can lie in — an edit it did not see, a restore it did not see — and the rule that makes
 * everything else it cannot see cost time rather than a verdict.
 *
 * ⚠️ **NOTHING HERE HOLDS THE SPEED**, for 0115's reason: a harness that started a new vitest per
 * probe would report every probe correctly and merely take two hours. The clock is in the decision.
 */

describe('0344 — a live vitest is asked, and is not trusted to have let go', () => {
  it('THE ONE THAT WAS FOUND BY IT HAPPENING: a Windows path is spelled the way the module graph spells it', () => {
    expect(asModulePath('C:\\work\\w0\\src\\app\\frame.ts')).toBe('C:/work/w0/src/app/frame.ts');
    expect(asModulePath('/tmp/w0/src/app/frame.ts')).toBe('/tmp/w0/src/app/frame.ts');
  });

  it('THE READ-BACK: a module still holding a transform is named, however its path is spelled', () => {
    const graph = [
      { file: 'c:/work/w0/src/app/frame.ts', id: 'c:/work/w0/src/app/frame.ts', transformResult: { code: '' } },
      { file: 'C:/work/w0/src/app/frame.ts', id: 'C:/work/w0/src/app/frame.ts?v=1', transformResult: null },
      { file: 'C:/work/w0/src/app/boss.ts', id: 'C:/work/w0/src/app/boss.ts', transformResult: { code: '' } },
      { file: null, id: 'virtual:thing', transformResult: { code: '' } },
    ];
    /*
      ⚠️ **THE FIRST ROW IS THE SPIKE'S OWN BUG.** A keyed lookup on `C:\…` or on the other case of the
      drive letter misses it and reports a file that was never loaded. Walking the graph does not.
    */
    expect(unflushed(graph, 'C:\\work\\w0\\src\\app\\frame.ts')).toEqual(['c:/work/w0/src/app/frame.ts']);
    expect(unflushed(graph.slice(1), 'C:\\work\\w0\\src\\app\\frame.ts')).toEqual([]);
  });

  it('A WARM RUN CAN PASS A PROBE AND CAN NEVER FAIL ONE: only red settles it', () => {
    expect(warmSettles('red')).toBe(true);
    for (const other of ['NO SUCH GUARD', 'NOT THIS GUARD', 'NEVER REACHED ITS CLAIM'] as const) {
      expect(warmSettles(other), `${other} from a live instance must be asked again of a new vitest`).toBe(false);
    }
  });
});

describe('0344 — and the instance itself, because the three above are about a model of it', () => {
  /*
    ⚠️ **A REAL INSTANCE OVER A REAL TREE, WHICH IS `docs/decisions/0027-measure-the-picture-not-the-model.md`.**
    The functions above agree with their author about what vite's module graph looks like. This asks
    the vitest this repository has installed, through the client the harness itself uses, so an
    upgrade that changes what `invalidateFile` means reddens here rather than in a two-hour proof.
  */
  const fixture = mkdtempSync(join(tmpdir(), 'itc-warm-'));
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  /*
    A wall-clock budget, so 0245: three times the worst cost measured under the whole suite.
    Measured under `npm run check` on the development box — see the decision for the number.
  */
  it('THE ONE IT IS FOR: a live vitest sees the edit, and then sees it taken back', { timeout: 120_000 }, async () => {
    mkdirSync(join(fixture, 'src'));
    mkdirSync(join(fixture, 'tests'));
    writeFileSync(join(fixture, 'package.json'), '{ "type": "module" }\n');
    writeFileSync(join(fixture, 'src/value.ts'), 'export const VALUE = 1;\n');
    writeFileSync(
      join(fixture, 'tests/value.test.ts'),
      "import { it, expect } from 'vitest';\nimport { VALUE } from '../src/value.ts';\nit('the value is one', () => { expect(VALUE).toBe(1); });\n",
    );
    linkModules(fixture);

    const warm = await startWarm(fixture);
    try {
      const guard = 'the value is one';
      const before = await warm.run('tests/value.test.ts', guard, []);
      expect(before, 'the fixture is green before anything is broken').toEqual({ failed: [], ran: 1 });

      writeFileSync(join(fixture, 'src/value.ts'), 'export const VALUE = 2;\n');
      const broken = await warm.run('tests/value.test.ts', guard, ['src/value.ts']);
      expect(verdictOf(broken, guard), 'the edit was not seen: the instance ran the module it already had').toBe('red');
      expect(isAVerdict(broken.failed[0]!.message)).toBe(true);

      writeFileSync(join(fixture, 'src/value.ts'), 'export const VALUE = 1;\n');
      await warm.flush(['src/value.ts']);
      const restored = await warm.run('tests/value.test.ts', guard, []);
      expect(restored, 'the restore was not seen: the next probe here would go red for this one’s break').toEqual({
        failed: [],
        ran: 1,
      });
    } finally {
      await warm.close();
    }
  });
});
