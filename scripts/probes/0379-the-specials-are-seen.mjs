// The breaks behind docs/decisions/0379-the-specials-are-seen.md.
//
// ⚠️ Each puts one change back to what the play refused. The sizes and the pods' art have no probe:
// "more visible" is a verdict about the picture, owed to the play, and a guard ranking one body's size
// against another's is the content limiter 0295 deleted five of.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0379',
    suite: 'tests/bombs.test.ts',
    broke: 'the bomb thrown at the old speed',
    guard: 'every thrown kind takes the better part of a second from the press to going off',
    edit: {
      path: 'src/content/shots.ts',
      find: "  bomb: { sprite: SPRITE.bomb, spriteHit: SPRITE.bomb, radius: 3.2, health: 1, damage: 0, speed: 1.5,",
      replace: "  bomb: { sprite: SPRITE.bomb, spriteHit: SPRITE.bomb, radius: 3.2, health: 1, damage: 0, speed: 2.2,",
    },
  },
  {
    decision: '0379',
    suite: 'tests/storm.test.ts',
    broke: 'the storm’s flicker at its old length',
    guard: 'the storm flickers for at least a second',
    edit: { path: 'src/content/specials.ts', find: 'flicker: 8, flickerSteps: 64 }', replace: 'flicker: 8, flickerSteps: 32 }' },
  },
  {
    decision: '0379',
    suite: 'tests/storm.test.ts',
    broke: 'the whirlpool growing at its old rate',
    guard: 'the whirlpool is on the screen for at least three and a half seconds',
    edit: { path: 'src/content/specials.ts', find: 'twist: 0.25, grow: 0.6,', replace: 'twist: 0.25, grow: 0.7,' },
  },
  {
    decision: '0379',
    suite: 'tests/surge.test.ts',
    broke: 'a surge that fires no pods',
    guard: 'every fitted tube with every tube special',
    edit: { path: 'src/app/frame.ts', find: '  for (let j = 0; j < pods.count; j++) {', replace: '  for (let j = 0; j < 0; j++) {' },
  },
  {
    decision: '0379',
    suite: 'tests/surge.test.ts',
    broke: 'the pods firing from the fitted tubes rather than from where they are drawn',
    guard: 'every fitted tube with every tube special',
    edit: {
      path: 'src/app/frame.ts',
      find: '    reset(missile, w.ship.along + MUZZLE_ALONG, w.ship.across + POD_ACROSS * side, podRow);',
      replace: '    reset(missile, w.ship.along + MUZZLE_ALONG, w.ship.across + LAUNCHER_ACROSS * side, podRow);',
    },
  },
  {
    decision: '0379',
    suite: 'tests/surge.test.ts',
    // As it was: no tube, no clock — so a ship with none fitted gets nothing from its surge.
    broke: 'a ship with no tubes firing no pods',
    guard: 'with no tubes fitted the pods still fire',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.weapon.launchers === 0 && surge === null) return;',
      replace: '  if (w.weapon.launchers === 0) return;',
    },
  },
  {
    decision: '0379',
    suite: 'tests/surge.test.ts',
    broke: 'the missile pool at its old size',
    guard: 'never fill the missile pool',
    edit: { path: 'src/app/mount.ts', find: '  missiles: 40,', replace: '  missiles: 24,' },
  },
];
