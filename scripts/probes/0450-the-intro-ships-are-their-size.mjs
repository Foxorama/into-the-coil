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
      find: 'export const HANGAR_SCALE = 30 / SHIP_BOX;',
      replace: 'export const HANGAR_SCALE = 30 / 7;',
    },
  },
  {
    decision: '0450',
    suite: 'tests/intro.test.ts',
    broke: 'the saucer at the shared scale in the chase, the forty per cent asked for not taken',
    guard: 'draws every pilot’s ship no bigger than the fighter was beside the bar door',
    edit: {
      path: 'src/content/ships.ts',
      find: '    intro: { hangar: 1, outside: 0.8 },',
      replace: '    intro: { hangar: 1, outside: 1 },',
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
