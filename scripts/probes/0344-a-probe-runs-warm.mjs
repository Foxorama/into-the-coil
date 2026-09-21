// The breaks behind docs/decisions/0344-a-probe-runs-warm.md.
//
// ⚠️ LIKE 0115's, THESE BREAK THE HARNESS THAT RUNS THEM. Each is applied to a disposable copy, and
// the copy's `scripts/prove-worker.mjs` is what `tests/prove-worker.test.ts` forks — the harness
// judging them is the one in the tree `npm run prove` was started from, and is not the one broken.
//
// ⚠️ AND WHAT THEY CANNOT PROVE IS THE SPEED, for the reason 0115 gives: a probe cannot redden a test
// for being slow. What is probed is the two directions a live instance can lie in, and the rule that
// makes every other blindness cost time instead of a verdict.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0344',
    suite: 'tests/prove-worker.test.ts',
    // The spike's own bug, restored: `path.resolve` hands back backslashes and the graph is keyed on `/`.
    broke: 'a path handed to the module graph as Windows spelled it, so the lookup misses and nothing is invalidated',
    guard: 'THE ONE THAT WAS FOUND BY IT HAPPENING: a Windows path is spelled the way the module graph spells it',
    edit: {
      path: 'scripts/prove-worker.mjs',
      find: "  return path.replaceAll('\\\\', '/');",
      replace: '  return path;',
    },
  },
  {
    decision: '0344',
    suite: 'tests/prove-worker.test.ts',
    broke: 'the read-back answering that nothing is held, whatever the graph holds',
    guard: 'THE READ-BACK: a module still holding a transform is named, however its path is spelled',
    edit: {
      path: 'scripts/prove-worker.mjs',
      find: '    if (mod.transformResult != null) out.push(mod.id ?? mod.file);',
      replace: '    if (mod.transformResult === undefined) out.push(mod.id ?? mod.file);',
    },
  },
  {
    decision: '0344',
    suite: 'tests/prove-worker.test.ts',
    // The one that would turn every blindness of the instance into a STILL GREEN nobody can explain.
    broke: 'a live instance allowed to settle a probe it did not see go red',
    guard: 'A WARM RUN CAN PASS A PROBE AND CAN NEVER FAIL ONE: only red settles it',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: "  return verdict === 'red';",
      replace: "  return verdict !== 'NO SUCH GUARD';",
    },
  },
  {
    decision: '0344',
    suite: 'tests/prove-worker.test.ts',
    /*
      ⚠️ THE ONE ABOUT THE INSTANCE RATHER THAN A MODEL OF IT. With the invalidation gone the live vitest
      still holds `VALUE = 1`, and the read-back refuses the run — which is the claim: a stale module
      is an error the harness raises, never a verdict it reports.
    */
    broke: 'the flush reading the graph back without ever having invalidated anything',
    guard: 'THE ONE IT IS FOR: a live vitest sees the edit, and then sees it taken back',
    edit: {
      path: 'scripts/prove-worker.mjs',
      find: '    vitest.invalidateFile(path);\n',
      replace: '',
    },
  },
];
