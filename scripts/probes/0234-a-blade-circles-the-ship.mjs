// The breaks behind docs/decisions/0234-a-blade-circles-the-ship.md.
//
// ⚠️ The blade is the first shot that survives arriving, and every break here is the tidy refactor
// that would quietly make it a pulse again: a spiral that stops widening, an arrival that spends it,
// a second landing on the same flash, a throw with no sound. The kind's own row — ladder, face and
// hulls — is held by 0233's guards over every gun, and the last two probes show that they see it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // The spiral frozen at its starting radius: a ring rather than a spiral, and a gun that never reaches.
    broke: 'the spiral no longer widening, so a blade circles the ship at one distance',
    guard: 'THE SPIRAL: a thrown blade',
    edit: {
      path: 'src/app/frame.ts',
      find: '    b.orbitRadius += b.orbitGrow;',
      replace: '    b.orbitRadius += 0 * b.orbitGrow;',
    },
  },
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // The blade spent by its first arrival, which is a pulse thrown sideways.
    broke: 'an arrival spending the whole blade, so it lands once and is gone',
    guard: 'THE SWEEP: a blade lands',
    edit: {
      path: 'src/sim/collide.ts',
      find: '      shot.health -= 1;\n      if (shot.health <= 0) shots.releaseAt(s);',
      replace: '      shot.health = 0;\n      if (shot.health <= 0) shots.releaseAt(s);',
    },
  },
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // The flash no longer consulted: a blade lying across a body lands on it every step.
    broke: 'a surviving shot landing on a body still flashing from the last landing',
    guard: 'THE SWEEP: a blade lands',
    edit: {
      path: 'src/sim/collide.ts',
      find: '      if (shot.health > 1 && target.flashFor > 0) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // The swap removed: one bitmap for two seconds, which is a star and not a shuriken.
    broke: 'the two turns never swapped, so the blade does not spin',
    guard: 'THE SPIN: a blade shows',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const turned = b.spriteBase;\n      b.spriteBase = b.spriteHit;\n      b.spriteHit = turned;',
      replace: '      const turned = b.spriteBase;\n      b.spriteBase = turned;',
    },
  },
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // A silent throw.
    broke: 'the throw cue removed',
    guard: 'THE CUES: a throw sounds',
    edit: {
      path: 'src/app/frame.ts',
      find: "  w.onCue('throw', w.ship.across);\n",
      replace: '',
    },
  },
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // A bite that the pool arithmetic cannot see and nothing else reports.
    broke: 'a bite no longer sounding as a hit, because the pool arithmetic cannot see a shot that survives',
    guard: 'THE CUES: a throw sounds',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const bites = bladeHits === null ? 0 : w.hits.count;',
      replace: '    const bites = 0 * (bladeHits === null ? 0 : w.hits.count);',
    },
  },
  {
    decision: '0234',
    suite: 'tests/blades.test.ts',
    // The pool cut under what the cap keeps in the air. ⚠️ A longer spiral cannot show it: a blade
    // spirals off the lane's across cull inside four seconds whatever its clock says, so the pool is
    // the number that has to be wrong.
    broke: 'the pulse’s pool cut below the blades the cap keeps in the air',
    guard: 'never fills with blades',
    edit: {
      path: 'src/app/mount.ts',
      find: '  playerShots: 88,',
      replace: '  playerShots: 8,',
    },
  },
  {
    decision: '0234',
    suite: 'tests/weapons.test.ts',
    // The shuriken's hull ladder pointed at the pulse's — 0233's guard over every gun sees it.
    broke: 'the shuriken’s first hull made the pulse’s',
    guard: 'THE HULLS: every gun has its own',
    edit: {
      path: 'src/content/ships.ts',
      find: '    { base: SPRITE.shipStar, hit: SPRITE.shipStarHit },',
      replace: '    { base: SPRITE.ship, hit: SPRITE.shipHit },',
    },
  },
  {
    decision: '0234',
    suite: 'tests/weapons.test.ts',
    // The shuriken offered under the arc's face.
    broke: 'the shuriken’s pickup face given the arc’s bolt',
    guard: 'THE FACES: the weapon pickup offers every gun',
    edit: {
      path: 'src/content/weapons.ts',
      find: '    pickup: SPRITE.pickupShuriken,',
      replace: '    pickup: SPRITE.pickupArc,',
    },
  },
];
