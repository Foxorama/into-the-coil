// The breaks behind docs/decisions/0357-a-void-blunts-a-blade.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0357',
    suite: 'tests/blades.test.ts',
    // The line as it stood: the blast releases whatever it bit, so one bite costs a blade all twelve
    // of its arrivals — which is what made medusa's last phase read as a gun that does not work.
    broke: 'a void releasing the whole blade it bit, edge and all',
    guard: 'THE BITE: a blade goes on with one less edge',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (shot.health > 1) {\n        if (shot.landIn > 0) continue;\n        shot.landIn = IMPACT_FLASH_STEPS;\n      }\n      bite(blast, row, shot.damage);\n      shot.health -= 1;\n      if (shot.health <= 0) w.playerShots.releaseAt(s);',
      replace: '      bite(blast, row, shot.damage);\n      w.playerShots.releaseAt(s);',
    },
  },
  {
    decision: '0357',
    suite: 'tests/blades.test.ts',
    // The same break, seen where the player sees it: the boss stops taking the blade's damage.
    broke: 'a void releasing the whole blade, read off what medusa loses a second',
    guard: 'THE PICTURE: a boss that rains void still takes the blade’s damage',
    edit: {
      path: 'src/app/frame.ts',
      find: '      bite(blast, row, shot.damage);\n      shot.health -= 1;\n      if (shot.health <= 0) w.playerShots.releaseAt(s);',
      replace: '      bite(blast, row, shot.damage);\n      w.playerShots.releaseAt(s);',
    },
  },
  {
    decision: '0357',
    suite: 'tests/blades.test.ts',
    // The edge spent without the flash to space it: a blade inside a blast bites on every step, and a
    // six-point appetite is gone in three of them with nothing drawn that anybody could read.
    broke: 'a blade feeding a void on every step it overlaps, rather than once per flash',
    guard: 'and it feeds once per flash rather than every step it is inside one',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (shot.health > 1) {\n        if (shot.landIn > 0) continue;\n        shot.landIn = IMPACT_FLASH_STEPS;\n      }\n      bite(blast, row, shot.damage);',
      replace: '      bite(blast, row, shot.damage);',
    },
  },
  {
    decision: '0357',
    suite: 'tests/blades.test.ts',
    // The rule turned into a blade exemption: nothing is spent by a void at all, so a pulse flies
    // through the thing whose whole purpose is to eat it.
    broke: 'a void biting without spending the shot, so a pulse is never eaten',
    guard: 'and a pulse is still spent by one, because one is all it has',
    edit: {
      path: 'src/app/frame.ts',
      find: '      shot.health -= 1;\n      if (shot.health <= 0) w.playerShots.releaseAt(s);',
      replace: '      shot.health -= 0;',
    },
  },
];
