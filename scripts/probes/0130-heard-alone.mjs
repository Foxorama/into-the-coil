// The break behind docs/decisions/0130-a-layer-can-be-heard-on-its-own.md.
//
// ⚠️ THE BREAK IS THE OBVIOUS IMPLEMENTATION, which is what makes it worth planting. "Audition this
// layer" reads as "solo it", and solo is what `rig/dash.ts` already had: the survivor sits at
// whatever the LADDER says at the rung on screen. Fourteen of the twenty-three are closed at any
// given rung (docs/decisions/0129), so that version hands back silence for most of the table most of
// the time — the exact state the report was written against, wearing a button.
//
// So the edit below is not a typo anybody would make; it is the design anybody would reach for
// first, and the guard has to be the thing that refuses it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0130',
    suite: 'tests/dash.test.ts',
    broke: 'auditioning a layer at the rung on screen rather than at the loudest the place takes it',
    guard: 'and NO LAYER IS UNREACHABLE — all twenty-three can be got at, in every place',
    edit: {
      path: 'rig/transport.ts',
      find: '  for (const rung of MUSIC_LEVELS) {',
      replace: "  for (const rung of ['run'] as const) {",
    },
  },
];
