// The breaks behind docs/decisions/0598-the-secret-pilots-reviewed.md — each one a defect the review found, put back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0598',
    suite: 'tests/dance.test.ts',
    broke: 'a dance landing the whole of the gun’s pool into the blades’ log',
    guard: 'a dancing duck’s paintballs still splat where they land',
    edit: {
      path: 'src/app/frame.ts',
      find: "    const bladeHits = w.weapon.flight === 'coil' || w.weapon.flight === 'tether' ? w.hits : null;",
      replace: "    const bladeHits = w.weapon.flight === 'coil' || w.weapon.flight === 'tether' || w.danceFor > 0 ? w.hits : null;",
    },
  },
  {
    decision: '0598',
    suite: 'tests/dance.test.ts',
    broke: 'a dance weighed on a boss by the gun the ship carries',
    guard: 'on a boss, the War Dance lands as much from every ship but the ball, whatever its gun weighs there',
    edit: {
      path: 'src/app/frame.ts',
      find: "    const ramOpen = w.weapon.flight === 'ram' ? gunOpen : open;",
      replace: '    const ramOpen = gunOpen;',
    },
  },
  {
    decision: '0598',
    suite: 'tests/duck.test.ts',
    broke: 'the jet landed a step further round than it was drawn',
    guard: 'lands only where it is drawn, every step of it, the last included',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const angle = jetAngle(w.jetLaidAt, jet);',
      replace: '  const angle = jetAngle(w.jetAt, jet);',
    },
  },
  {
    decision: '0598',
    suite: 'tests/duck.test.ts',
    broke: 'the jet’s root drawn where the muzzle is, not where it was',
    guard: 'between steps, its root is drawn on the muzzle where the ship is drawn',
    edit: {
      path: 'src/app/frame.ts',
      find: '    link.prevAcross = w.ship.prevAcross + w.shipRow.muzzle.across + Math.sin(angle) * jet.length;',
      replace: '    link.prevAcross = endAcross;',
    },
  },
  {
    decision: '0598',
    suite: 'tests/duck.test.ts',
    broke: 'the jet played on from the wreck',
    guard: 'ends with the ship that played it, at the wreck and not when the beat is over',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.dyingIn > 0) {\n    w.jetFor = 0;\n    w.jetKind = null;\n  }\n',
      replace: '',
    },
  },
  {
    decision: '0598',
    suite: 'tests/duck.test.ts',
    broke: 'the jet stroked over the bullets again',
    guard: 'is drawn under every hostile shot, in the player’s water and never the other side’s frost',
    // What 0595 did: the jet one more bolt of the last pass, stroked after the whole scene.
    edit: {
      path: 'src/render/scene.ts',
      find: "(e.kind === BEAM_BOLT_KIND ? true : e.kind === JET_BOLT_KIND ? 'jets' : false) !== beams",
      replace: '(e.kind === BEAM_BOLT_KIND) !== beams',
    },
  },
  {
    decision: '0598',
    suite: 'tests/duck.test.ts',
    broke: 'the Water Cannon’s face back in the frost’s ink',
    guard: 'is drawn under every hostile shot, in the player’s water and never the other side’s frost',
    edit: { path: 'src/render/bake.ts', find: "  pickupWater: 'water',", replace: "  pickupWater: 'frost'," },
  },
  {
    decision: '0598',
    suite: 'tests/duck.test.ts',
    broke: 'every colour in every place’s hopper, its bullets’ hue included',
    guard: 'in every place, every colour its hopper holds and none it leaves out for the place’s own bullets',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (held > 0 && paint.colours[i]!.not.includes(theme)) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0598',
    suite: 'tests/crashes.test.ts',
    broke: 'the hint promising a crash a shield takes',
    guard: 'the hint counts down what is left, and is gone once the lock is met',
    edit: {
      path: 'src/state/screens.ts',
      find: "owed.push('lose ' + left.crashes + ' more ' + (left.crashes === 1 ? 'life' : 'lives') + ' to a crash');",
      replace: "owed.push('crash into something ' + left.crashes + ' more ' + (left.crashes === 1 ? 'time' : 'times'));",
    },
  },
];
