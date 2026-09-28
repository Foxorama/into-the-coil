// The breaks behind docs/decisions/0409-a-failed-build-says-what-failed.md.
//
// Both directions of the early return in `stampBuildIdentity`'s `closeBundle`: taken away, the hook
// speaks about `sw.js` over a bundle that never happened; taken always, the worker ships unstamped.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0409',
    suite: 'tests/build.test.ts',
    broke: 'the identity hook checks sw.js whether or not the bundler refused the source',
    guard: 'says nothing about sw.js when the bundler already refused the source',
    edit: {
      path: 'vite.config.ts',
      find: '      if (!bundled) return;',
      replace: '      if (bundled === null) return;',
    },
  },
  {
    decision: '0409',
    suite: 'tests/build.test.ts',
    broke: 'the identity hook never checks sw.js, so a written bundle ships its placeholders',
    guard: 'still fails a build whose bundle IS written and whose sw.js is not',
    edit: {
      path: 'vite.config.ts',
      find: '      if (!bundled) return;',
      replace: '      if (bundled || !bundled) return;',
    },
  },
];
