// The intro's ships are their size — docs/decisions/0450-the-intro-ships-are-their-size.md
//
// Every guard 0450 adds, broken on purpose. `node scripts/prove-guard.mjs 0450`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0450',
    suite: 'tests/intro.test.ts',
    broke: 'the whole box baked at the fighter’s bare hull’s scale again, a third bigger than it ever was',
    guard: 'draws every pilot’s ship no bigger than the fighter was beside the bar door',
    edit: {
      path: 'src/content/port.ts',
      // 0461 took the box to 24; the break is still the bare hull's scale for the whole box.
      find: 'export const HANGAR_SCALE = 24 / SHIP_BOX;',
      replace: 'export const HANGAR_SCALE = 24 / 7;',
    },
  },
  {
    decision: '0450',
    suite: 'tests/intro.test.ts',
    broke: 'the saucer at the shared scale in the chase, the forty per cent asked for not taken',
    guard: 'draws every pilot’s ship no bigger than the fighter was beside the bar door',
    edit: {
      path: 'src/content/ships.ts',
      // Over its disc since 0461; the break is still the chase's extra reduction not taken.
      find: '    intro: { hangar: 1 / CADDIE_DISC, outside: 0.8 / CADDIE_DISC },',
      replace: '    intro: { hangar: 1 / CADDIE_DISC, outside: 1 / CADDIE_DISC },',
    },
  },
  {
    decision: '0450',
    suite: 'tests/intro.test.ts',
    broke: 'the chase burning the hangar’s flames, so the saucer flies after her on one drive',
    guard: 'draws every pilot’s ship no bigger than the fighter was beside the bar door',
    edit: {
      path: 'src/render/port.ts',
      find: '  if (over < 1) {',
      replace: '  if (over <= 1) {',
    },
  },
];
