// The flash cap is measured — docs/decisions/0456-the-flash-cap-is-measured.md
//
// The one guard 0456 adds to the suite, broken on purpose. `node scripts/prove-guard.mjs 0456`.
// The meter itself (`scripts/weigh-flashes.mjs`) is seen to fail by its own calibration strobes,
// every time it runs, before it judges anything.

export const PROBES = [
  {
    decision: '0456',
    suite: 'tests/combat.test.ts',
    // The floor taken out: the duty alone, which relit the gyre ten times a second.
    broke: 'the wash relit on the duty alone, five times a second under a gun that lands every step',
    guard: 'THE FLASH CAP ON A BODY',
    edit: {
      path: 'src/sim/collide.ts',
      find: 'const FLASH_CAP_STEPS = 20;',
      replace: 'const FLASH_CAP_STEPS = 0;',
    },
  },
  {
    decision: '0456',
    suite: 'tests/combat.test.ts',
    // The floor kept but set to the wrong rate — four a second, which a reader of "a third" might miss.
    broke: 'the floor at fifteen steps, four washes a second',
    guard: 'THE FLASH CAP ON A BODY',
    edit: {
      path: 'src/sim/collide.ts',
      find: 'const FLASH_CAP_STEPS = 20;',
      replace: 'const FLASH_CAP_STEPS = 15;',
    },
  },
];
