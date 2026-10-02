// The ships are jazzed — docs/decisions/0461-the-ships-are-jazzed.md
//
// Every guard 0461 adds, broken on purpose. `node scripts/prove-guard.mjs 0461`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0461',
    suite: 'tests/dice.test.ts',
    // The frame noticing the lurch and telling nobody: the dice hang still whatever the ship does.
    broke: 'the jolt read and never raised',
    guard: 'THE ASK: a hard push swings them back once, and a hard stop forward once',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.joltWay = way;\n    w.onJolt(way);',
      replace: '    w.joltWay = way;',
    },
  },
  {
    decision: '0461',
    suite: 'tests/dice.test.ts',
    // Any change in speed a lurch: the dice swing on every nudge of the stick.
    broke: 'the jolt raised on any change at all',
    guard: 'and a stick eased over or held moves nothing',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (Math.abs(change) >= JOLT_AT && way !== w.joltWay) {',
      replace: '  if (Math.abs(change) >= JOLT_EASED && way !== w.joltWay) {',
    },
  },
  {
    decision: '0461',
    suite: 'tests/mounts.test.ts',
    // The saucer's missiles leaving from where its tubes used to lie, across its face.
    broke: 'the caddie’s tubes put back on its disc',
    guard: 'AND THE SAUCER’S',
    edit: {
      path: 'src/content/ships.ts',
      find: '    tubes: [[], [{ along: 1.18, across: -3.55 }], [{ along: 1.18, across: -3.55 }, { along: 1.18, across: 3.55 }]],',
      replace: '    tubes: SIDE_TUBES,',
    },
  },
  {
    decision: '0461',
    suite: 'tests/intro.test.ts',
    // The intro's ships at the size that was played as too large.
    broke: 'the hangar’s box put back at 30',
    guard: 'draws every pilot’s ship no bigger than the fighter was beside the bar door',
    edit: {
      path: 'src/content/port.ts',
      find: 'export const HANGAR_SCALE = 24 / SHIP_BOX;',
      replace: 'export const HANGAR_SCALE = 30 / SHIP_BOX;',
    },
  },
  {
    decision: '0461',
    suite: 'tests/intro.test.ts',
    // The saucer at the box's old factors, which with its smaller disc is a third under the ask.
    broke: 'the caddie’s intro left at the box’s factors',
    guard: 'draws every pilot’s ship no bigger than the fighter was beside the bar door',
    edit: {
      path: 'src/content/ships.ts',
      find: '    intro: { hangar: 1 / CADDIE_DISC, outside: 0.8 / CADDIE_DISC },',
      replace: '    intro: { hangar: 1, outside: 0.8 },',
    },
  },
];
