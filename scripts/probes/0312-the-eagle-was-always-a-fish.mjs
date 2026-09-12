// The eagle was always a fish — docs/decisions/0312-the-eagle-was-always-a-fish.md
//
// The rename adds no behaviour and no guard over the game. What it adds is a guard over the PROBE SET,
// because renaming a test file is what stranded ten probes here in the first place.
// `node scripts/prove-guard.mjs 0312`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0312',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ **THE FAILURE THIS PR CAUSED, PUT BACK.** `tests/eagle.test.ts` became `tests/volans.test.ts`
      and ten probes belonging to 0249 and 0262 went on naming the old path. Every anchor still
      resolved — the breaks could all still be MADE — so the live anchor check stayed green, and what
      each of them reported was `NOTHING WAS PROVEN`, forty minutes into `npm run prove`.

      ⚠️ **IT STRANDS ANOTHER DECISION'S PROBE, deliberately and out of necessity** — the live anchor
      check's own probe says why, one file over: deliberately because the failure is an edit somewhere
      nobody opened this file, and out of necessity because a `guard` quoted from THIS file would appear
      in it twice and the harness refuses an ambiguous anchor.
    */
    broke: 'a real probe’s guard named a test that does not exist, exactly as renaming a test does',
    guard: 'every probe still names a test that exists',
    edit: {
      path: 'scripts/probes/0078-sky-speed.mjs',
      find: "guard: 'moves both layers twice as fast as they shipped, which is what was asked for',",
      replace: "guard: 'moves both layers twice as fast as they were asked to, which is what shipped',",
    },
  },
  {
    decision: '0312',
    suite: 'tests/prove-guard.test.ts',
    // And the other half of the same class: the file the probe names is gone altogether, which is
    // literally what a rename does to it.
    broke: 'a real probe’s suite pointed at a test file that is not there, which is what a rename leaves',
    guard: 'every probe still names a test that exists',
    edit: {
      path: 'scripts/probes/0078-sky-speed.mjs',
      find: "    suite: 'tests/budget.test.ts',\n    /*\n      ⚠️ THE HALF-READ,",
      replace: "    suite: 'tests/eagle.test.ts',\n    /*\n      ⚠️ THE HALF-READ,",
    },
  },
];
