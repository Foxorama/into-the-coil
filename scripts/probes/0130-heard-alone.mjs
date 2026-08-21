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
      /*
        ⚠️ RE-ANCHORED BY 0189, and the break had to grow as well as move. `loudestGain` has TWO
        rung loops now — the place's own, and the shared-ladder fallback for a layer the place
        closes everywhere — so `for (const rung of MUSIC_LEVELS) {` appears twice and matched
        neither uniquely. Restricting only the first would also have gone GREEN: a layer closed at
        `run` would fall through to the fallback and arrive at the right answer by the other road.
        **What is replaced is the whole first pass**, so the audition reads one rung and the
        fallback stays exactly where 0189 put it.
      */
      find: `  let most = 0;
  for (const rung of MUSIC_LEVELS) {
    const at = targetGain(theme, rung, layer, 1);
    if (at > most) most = at;
  }
  if (most > 0) return most;`,
      replace: `  let most = targetGain(theme, 'run', layer, 1);
  if (most > 0) return most;`,
    },
  },
];
