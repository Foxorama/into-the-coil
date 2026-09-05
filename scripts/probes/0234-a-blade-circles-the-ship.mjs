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
    // ⚠️ Re-aimed by 0242: this was *the spiral frozen at its starting radius* while a blade circled
    // the ship; a blade coils up the lane now, and the same defect is the loop's centre standing
    // still — a ring rather than a coil, and a gun that never reaches.
    broke: 'the loop’s centre no longer going up the lane, so a blade circles in place and never reaches the edge',
    guard: 'THE EDGE: a blade is on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '    b.fromAlong += w.scrollPerStep + b.orbitGrow;',
      replace: '    b.fromAlong += w.scrollPerStep;',
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
    // The gate no longer consulted: a blade lying across a body lands on it every step.
    // ⚠️ Re-anchored by 0242: the gate is the blade's own `landIn` now, not the body's flash.
    broke: 'a surviving shot landing again before its own flash has run, so a blade across a body is a saw',
    guard: 'THE SWEEP: a blade lands',
    edit: {
      path: 'src/sim/collide.ts',
      find: '        if (shot.landIn > 0) continue;\n',
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
  {
    decision: '0234',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE GUARD 0234 OWED TO 0087, seen red from its other side. A third weapon face lengthened
      the wait and 0087's bob probe went STILL GREEN against the guard 0233 had aimed it at, so the
      bob's rhythm is held in seconds now — and the floor of that guard is what the 0087 probe
      reddens. This is the ceiling: a bob authored quick and strong enough to survive the ease is a
      shiver, and a pickup that shivers is not the thing 0087 describes.
    */
    broke: 'the bob authored five times as quick and eight times as strong, so a waiting pickup shivers',
    guard: 'and the bob is a bob and not a shiver',
    edit: {
      path: 'src/app/frame.ts',
      find: '      PICKUP_BOB_SPEED * Math.sin(w.cameraAlong / PICKUP_BOB_UNITS + item.bobPhase);',
      replace: '      PICKUP_BOB_SPEED * 8 * Math.sin(w.cameraAlong / 3 + item.bobPhase);',
    },
  },
];
