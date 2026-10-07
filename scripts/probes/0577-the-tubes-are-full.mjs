// The breaks behind docs/decisions/0577-the-tubes-are-full.md.
//
// ⚠️ Four ways back to the ladder or the one kind: a volley of one kind, a first tube slower than a
// full rack, a third tube past the hull, and a run handed more tubes than it can carry.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0577',
    suite: 'tests/missiles.test.ts',
    // The one kind 0233 fitted to every tube, put back in the volley: the top tube's kind fires twice.
    broke: 'every tube in a volley firing the top tube’s kind',
    guard: 'two tubes of two kinds each fire their own missile in one volley',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const kind = MISSILES[w.weapon.tubes[i]!];',
      replace: '    const kind = MISSILES[w.weapon.tubes[0]!];',
    },
  },
  {
    decision: '0577',
    suite: 'tests/missiles.test.ts',
    // The rate step put back: one tube fires at half the rate of a full rack.
    broke: 'a first tube slower than a full rack, which is the ladder’s rate step back',
    guard: '0577 — A TUBE IS FULL FROM THE MOMENT IT IS FITTED',
    edit: {
      path: 'src/content/pickups.ts',
      find: '  const missileEvery = MISSILE_BEAT_RATIO * every;',
      replace: '  const missileEvery = MISSILE_BEAT_RATIO * every * (launchers < MAX_LAUNCHERS ? 2 : 1);',
    },
  },
  {
    decision: '0577',
    suite: 'tests/run.test.ts',
    broke: 'a third missile pickup fitting a third tube',
    guard: 'a full rack takes no third',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      if (!tubeRoom(state.tubes)) return state;\n',
      replace: '',
    },
  },
  {
    decision: '0577',
    suite: 'tests/run.test.ts',
    broke: 'a run begun on more tubes than a hull carries',
    guard: 'and a run carries in the tubes it is begun with, two at most',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '        tubes: (action.tubes ?? []).slice(0, MAX_LAUNCHERS),',
      replace: '        tubes: action.tubes ?? [],',
    },
  },
];
