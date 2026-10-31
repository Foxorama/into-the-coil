// The breaks behind docs/decisions/0699-the-firebird-is-finished.md.
//
// The Firebird as it shipped before 0699: every containment guard green on a car with no light on it,
// which is why the finish has a guard of its own (0698's, over the list of finished ships).
//
// ⚠️ ONE PROBE, AND A SECOND WAS WRITTEN AND SEEN STILL GREEN. "The Firebird dropped from the list of
// finished ships" cannot redden the guard, because the guard then does not look at the Firebird: the list is
// the queue's progress and not an invariant (0192), so a probe over it proves nothing and was deleted rather
// than a guard tightened round it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0699',
    suite: 'tests/accents.test.ts',
    broke: 'the rim light left off the Firebird, so it is the flat car it was — every other guard green',
    guard: '0698: every finished ship wears a rim light inside its edges, wide enough to be drawn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  rimLight(ctx, f, shade(gold, 0.2), 0.7, top, bottom, sealWidth, carOutline);\n}',
      replace: '  void top;\n  void bottom;\n  void sealWidth;\n  void carOutline;\n}',
    },
  },
];
