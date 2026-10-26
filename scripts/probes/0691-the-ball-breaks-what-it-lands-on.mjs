// The breaks behind docs/decisions/0691-the-ball-breaks-what-it-lands-on.md: the landing at one again, the enemies
// back in the ball's knock, and the heat back up.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0691',
    suite: 'tests/solid.test.ts',
    broke: 'a landing on a body dealing the ram’s three again, so a tough body lives it',
    guard: '0691 — THE ASK: flown into a body, however tough, the ball breaks it on contact',
    edit: {
      path: 'src/app/frame.ts',
      find: 'dancing === null ? RAM_BREAKS : 1, IMPACT_FLASH_STEPS, w.deaths, w.hits, ramGap, null, RAM_KIND);',
      replace: '1, IMPACT_FLASH_STEPS, w.deaths, w.hits, ramGap, null, RAM_KIND);',
    },
  },
  {
    decision: '0691',
    suite: 'tests/charge.test.ts',
    broke: 'a landing on a body dealing the ram’s three, felt as a knock and not a kill',
    guard: 'a landing on a body is a kill and a smash',
    edit: {
      path: 'src/app/frame.ts',
      find: 'dancing === null ? RAM_BREAKS : 1, IMPACT_FLASH_STEPS, w.deaths, w.hits, ramGap, null, RAM_KIND);',
      replace: '1, IMPACT_FLASH_STEPS, w.deaths, w.hits, ramGap, null, RAM_KIND);',
    },
  },
  {
    decision: '0691',
    suite: 'tests/ball.test.ts',
    broke: 'the heat back at 0648’s, a landing filling the gauge a tenth faster than its row says',
    guard: 'a boss takes more landings before the ball burns than a body does',
    edit: {
      path: 'src/content/weapons.ts',
      find: '      bossHeat: 0.06,',
      replace: '      bossHeat: 0.1,',
    },
  },
];
