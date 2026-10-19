// The breaks behind docs/decisions/0643-a-save-reads-every-version-before-its-own.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0643',
    suite: 'tests/lifts.test.ts',
    // The shape bumped and no lift written: every hangar written at version 1 would read as empty.
    broke: 'a hangar version bumped with no lift from the version before it',
    guard: 'every kept key has a lift from every version it has ever written',
    edit: {
      path: 'src/save/hangar.ts',
      find: 'export const HANGAR_VERSION = 1;',
      replace: 'export const HANGAR_VERSION = 2;',
    },
  },
  {
    decision: '0643',
    suite: 'tests/lifts.test.ts',
    // The chain walked from the wrong end: a version-1 document skips its first lift.
    broke: 'a document lifted from one version past its own',
    guard: 'steps an older document up through every lift in order',
    edit: {
      path: 'src/save/store.ts',
      find: '  for (let at = v; at < current; at++) {',
      replace: '  for (let at = v + 1; at < current; at++) {',
    },
  },
];
