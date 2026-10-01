// The breaks behind docs/decisions/0388-the-laser-is-jagged.md.
//
// Asked for: *"the pteradactyl head needs to shoot a random jagged lazer as it currently fires straight
// ahead… this change needs to affect the level 3 pteradactyl boss as well"* — warned along the zigzag.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0388',
    suite: 'tests/quetzal.test.ts',
    // The hurt left on the straight line while the picture zigzags: drawn one place, burning another.
    broke: 'a jagged beam hurting along its straight line, so the zigzag the player dodges is a picture',
    guard: 'THE REPORTED ONE, IN LANE UNITS: a jagged beam burns along its zigzag',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (beamDistance(b, w.ship.along, w.ship.across) > b.radius + w.ship.radius * w.tuning.hurtbox) continue;',
      replace:
        '      if (beamDistance(b, w.ship.along, w.ship.across) > b.radius + w.ship.radius * w.tuning.hurtbox || Math.abs(w.ship.across - b.across) > b.radius + w.ship.radius * w.tuning.hurtbox) continue;',
    },
  },
  {
    decision: '0388',
    suite: 'tests/quetzal.test.ts',
    // The painter keeping the straight stroke: the zigzag hurts, and the screen shows a line.
    broke: 'a jagged beam drawn straight, so its warning shows the player a line it will not burn along',
    guard: 'THE PICTURE: the warning is drawn dim, the beam bright and as wide as it hurts, on the zigzag it warned',
    edit: {
      path: 'src/render/scene.ts',
      // Re-anchored by 0453, whose beams are jagged when they have knots.
      find: '    if (beam && e.knots > 0) {',
      replace: '    if (beam && e.knots < 0) {',
    },
  },
  {
    decision: '0388',
    suite: 'tests/quetzal.test.ts',
    // One seed for every beam: a jagged line, the same jagged line every time — learnable, and not random.
    broke: 'every beam drawn on the same seed, so the zigzag is the same one every volley',
    guard: 'every beam is a new zigzag',
    edit: {
      path: 'src/app/boss.ts',
      // Re-anchored by 0403, whose volleys that fly together share one seed.
      find: '          bolt.spin = attack.together === true ? volleySeed : beamRng.int(0, 0x7fffffff);',
      replace: '          bolt.spin = attack.together === true ? volleySeed : 7 + 0 * beamRng.int(0, 0x7fffffff);',
    },
  },
  {
    decision: '0388',
    suite: 'tests/quetzal.test.ts',
    // The mouth's knot left off the line: a beam that starts a swing away from the head that fired it.
    broke: 'the zigzag’s last knot off the line, so the beam leaves the air beside the mouth',
    guard: 'and every one leaves the mouth that fired it',
    edit: {
      path: 'src/sim/jag.ts',
      // Re-anchored by 0453, whose beams say their own count of knots.
      find: '  if (knots <= 0 || i >= knots + 1) return 0;',
      replace: '  if (knots <= 0) return 0;',
    },
  },
  {
    decision: '0388',
    suite: 'tests/quetzal.test.ts',
    // The quetzal's mouth straight again: the level three boss the ask named, left as it was.
    broke: 'the quetzal’s mouth firing straight, so the level three boss the ask named is unchanged',
    guard: 'THE ASK: every laser the pterodactyls fire jags',
    edit: {
      path: 'src/content/bosses.ts',
      // Re-anchored by 0452, which put the mouth's root in the throat, and 0453, which gave it a path.
      find: "attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 6, from: [THROAT], jag: QUETZAL_ONE } },",
      replace: "attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 6, from: [THROAT] } },",
    },
  },
];
