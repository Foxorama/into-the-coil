// The blade is smaller — docs/decisions/0294-the-blade-is-smaller.md
//
// Every guard 0294 adds, broken on purpose. `node scripts/prove-guard.mjs 0294`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0294',
    suite: 'tests/weapons.test.ts',
    /*
      ⚠️ **THE DEFECT THIS DECISION SHIPPED FOR ONE COMMIT, AND NOTHING IN THE REPOSITORY SAW IT.**
      `shuriken` and `shurikenTurn` are the two frames of one spinning blade, swapped every four
      steps — one object at two moments, not two sprites that look alike. The star was shrunk and the
      turn face was left at 8, which is a blade that grows and shrinks four times a second, and every
      guard was green about it.

      ⚠️ **A PAIR THAT MUST AGREE AND IS NEVER ASKED TO** is the shape 0035 names about hurt twins,
      about a turn instead. This is that question, and the break is the state it shipped in.
    */
    broke: 'the turn face left at the size the other frame was, so a spinning blade pulses',
    guard: 'a blade’s two frames are ONE size',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  shurikenTurn: 5.6,',
      replace: '  shurikenTurn: 8,',
    },
  },
  {
    decision: '0294',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **THE LIT WEDGE BACK AT THE WIDTH THE BIGGER STAR COULD CARRY.** Shrinking the box put this
      mark at **1.97 px on a 1280×720 screen**, under 0106's floor of 2.5 — below which a mark is not
      drawn faintly, it is not drawn at all. It is the same fix its own comment records 0244 making
      when the box went the other way.
    */
    broke: 'the lit wedge back at its old width, so the smaller star draws a mark nobody can see',
    guard: 'no solid mark on a body is too thin to be drawn at all',
    edit: {
      path: 'src/render/bake.ts',
      find: '          [Math.cos(a + 0.29) * 0.52, Math.sin(a + 0.29) * 0.52],',
      replace: '          [Math.cos(a + 0.17) * 0.52, Math.sin(a + 0.17) * 0.52],',
    },
  },
  {
    decision: '0294',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **AND WIDENED ON THE LEADING SIDE INSTEAD, WHICH IS WHERE THERE IS NO ROOM.** The leading
      point sits on the star's own edge, so a wedge widened that way leaves the hull — measured at
      **0.17 px over** on the first attempt at the fix above. Two guards in one file pulling opposite
      ways, and only one direction satisfies both.
    */
    broke: 'the lit wedge widened on the leading side, so it hangs off the edge of the star',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: {
      path: 'src/render/bake.ts',
      find: '          [Math.cos(a - 0.16) * 0.36, Math.sin(a - 0.16) * 0.36],\n          [Math.cos(a + 0.29) * 0.52',
      replace: '          [Math.cos(a - 0.28) * 0.36, Math.sin(a - 0.28) * 0.36],\n          [Math.cos(a + 0.29) * 0.52',
    },
  },
];
