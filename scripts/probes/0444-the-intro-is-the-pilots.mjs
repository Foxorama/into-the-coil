// The breaks behind docs/decisions/0444-the-intro-is-the-pilots.md.
//
// One per half of tests/intro.test.ts's tilt guard: the hangar drawing the pilot's ship as the fight
// draws it, and the ship never tilting over once it is outside. Venoma's run has no probe here: its
// two guards went with it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0444',
    suite: 'tests/intro.test.ts',
    broke: 'the hangar drawing the saucer from above again, a green coin standing on its edge',
    guard: 'flies the pilot’s ship out of the hangar as the hangar sees it',
    edit: {
      path: 'src/render/port.ts',
      // ⚠️ Re-anchored by 0450, which draws each ship at its own size in the hangar.
      find: '  put(surface, view, PORT_SPRITE.blueSide, along, across, 1, 0, size);',
      replace: '  put(surface, view, PORT_SPRITE.blue, along, across, 1, 0, size);',
    },
  },
  {
    decision: '0444',
    suite: 'tests/intro.test.ts',
    broke: 'the saucer flying the whole chase side-on, never tilting into the fight’s view',
    guard: 'flies the pilot’s ship out of the hangar as the hangar sees it',
    edit: {
      path: 'src/render/port.ts',
      find: '  const tilt = ease(s, TILT.from, TILT.from + TILT.steps) * (TILT_FRAMES - 1);',
      replace: '  const tilt = 0;',
    },
  },
];
