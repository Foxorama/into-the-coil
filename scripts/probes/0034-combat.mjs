// The breaks behind docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md.
//
// Two of these are not hypothetical. The aiming frame and the sweep were both real bugs in this
// change, and one of them was found by `scripts/trace-frame.mjs` rather than by any assertion here —
// eight seconds of the shipped page in which nothing ever hit the player, on a build whose whole
// purpose was that something could. That is decision 0027 doing its job for the third time.
//
// ⚠️ Two probes below break the SAME line in opposite directions (the leading cull), because it has
// two failure modes and fixing one is how you cause the other: no cull and the pool fills with
// bullets that left the screen; a cull at the spawn line and every wave dies on the step it is born.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'the collision walking targets FORWARDS, so a release swaps an untested one into a slot already passed',
    guard: 'every target is tested, not merely the last one released',
    edit: {
      path: 'src/sim/collide.ts',
      find: '  for (let t = targets.size - 1; t >= 0; t--) {',
      replace: '  for (let t = 0; t < targets.size; t++) {',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    // ⚠️ THE SUBTLE ONE. Damaging on the first overlap found is the obvious implementation and it
    // silently makes an assist harmful: a smaller hurtbox removes overlaps, so the first one found
    // can become a heavier threat than the one a larger hurtbox met.
    broke: 'contact damaging on the FIRST overlap found rather than the worst, so shrinking a hurtbox can hurt more',
    guard: 'turning any knob up never increases the damage taken',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    if (threat.damage > worst) worst = threat.damage;',
      replace: '    if (worst === 0) worst = threat.damage;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'a content table expressing a threat as a multiple of SHIP_SPEED, which the layer ladder permits',
    guard: 'no content table names the ship constants',
    edit: {
      path: 'src/content/shots.ts',
      find: "import { SPRITE } from './sprites.ts';",
      replace:
        "import { SPRITE } from './sprites.ts';\n" +
        "import { SHIP_SPEED } from '../sim/flight.ts';\n" +
        'export const REFERENCE_SPEED = SHIP_SPEED;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'the leading cull removed, so a player shot outruns the camera and is never retired',
    guard: 'a player shot does not live forever ahead of the level',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    if (e.along < cull || e.along > cullLeading) pool.releaseAt(i);',
      replace: '    if (e.along < cull) pool.releaseAt(i);',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'the leading cull pulled INSIDE the spawn line, so every wave is retired on the step it is created',
    guard: 'a wave placed at the spawn line survives the step it arrives on',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  return spawnAlong(cameraAlong) + EDGE_MARGIN;',
      replace: '  return spawnAlong(cameraAlong) - EDGE_MARGIN;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'the collision testing two current positions instead of sweeping the step — a fast shot tunnels',
    guard: 'THE SWEEP: a shot that crosses the whole target in one step still hits it',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    t = t < 0 ? 0 : t > 1 ? 1 : t;',
      replace: '    t = 1;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    // The control for the one above. A sweep that reported contact for anything in motion would pass
    // the tunnelling test perfectly and make every bullet in the game a hit.
    broke: 'the sweep reporting contact whenever the two paths approach at all, however wide',
    guard: 'a shot that passes WIDE still misses',
    edit: {
      path: 'src/sim/collide.ts',
      find: '  return nearAlong * nearAlong + nearAcross * nearAcross <= reach * reach;',
      replace: '  return speedSquared > 0 || nearAlong * nearAlong + nearAcross * nearAcross <= reach * reach;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'invulnerability never set, so an overlapping threat bills the player sixty times a second',
    guard: 'a ship parked inside a volley loses one health, not one per step',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    target.invulnFor = invulnSteps;',
      replace: '    target.invulnFor = 0;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'a body consumed by being flown into, which makes ramming the cheapest way to clear the screen',
    guard: 'a body is not consumed by being flown into',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    if (consume) threats.releaseAt(i);',
      replace: '    threats.releaseAt(i);',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    // ⚠️ A REAL BUG, and one no assertion in this repository had a chance of catching when it
    // shipped: it was found by tracing eight seconds of the built page and noticing the player never
    // died. In-lane shots connected the whole time, which is why it hid.
    broke: 'an enemy aiming in WORLD coordinates, so its shot arrives where the ship was rather than where it is',
    guard: 'a shot from off the ship',
    edit: {
      path: 'src/app/frame.ts',
      find: '    shot.velAlong = (dAlong / distance) * bullet.speed + w.scrollPerStep;',
      replace: '    shot.velAlong = (dAlong / distance) * bullet.speed;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    broke: 'the painter walking its layers backwards, which buries the ship under everything else on screen',
    guard: 'a later layer is blitted after an earlier one',
    edit: {
      path: 'src/render/scene.ts',
      find: '  for (let layer = 0; layer < layers.length; layer++) {',
      replace: '  for (let layer = layers.length - 1; layer >= 0; layer--) {',
    },
  },
  {
    decision: '0034',
    suite: 'tests/budget.test.ts',
    broke: 'the frame wiped once per LAYER instead of once per frame — four full-canvas fills, invisible in a screenshot',
    // ⚠️ The harness matches a test TITLE, not the message on the assertion inside it. This probe
    // was first written against `each layer wiped the frame`, which is the message — it went red on
    // exactly the right line and the harness reported WRONG TEST, correctly.
    guard: 'costs the same split across layers as it does in one pool',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const entities = layers[layer]!;',
      replace: '    surface.clear();\n    const entities = layers[layer]!;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/budget.test.ts',
    // ⚠️ This is the probe for the LIST, not for the file. It proves `src/sim/collide.ts` is actually
    // being scanned rather than merely written down — 0025 says adding to the hot-file list is a
    // deliberate act, and an entry nobody checks is a deliberate act that did nothing.
    broke: 'an allocation planted in the collision loop, which is on the hot list for the first time in this change',
    guard: 'no hot file allocates',
    edit: {
      path: 'src/sim/collide.ts',
      find: '  let destroyed = 0;',
      replace: '  let destroyed = 0;\n  const label = `pairs`;\n  if (label.length < 0) return 0;',
    },
  },
  {
    decision: '0034',
    suite: 'tests/combat.test.ts',
    // ⚠️ Breaking a TUNING constant, which nothing is allowed to assert the value of. That is not a
    // contradiction: the guard says the dodge is possible AT ALL, in pixels and milliseconds, and
    // this proves it notices when it stops being. `docs/decisions/0027-…` forbids a threshold on
    // taste, not an assertion that the game is playable.
    broke: 'the ship slowed until it cannot cross its own hurtbox before an aimed shot arrives',
    guard: 'the same shot misses a ship that moved',
    edit: {
      path: 'src/sim/flight.ts',
      find: 'export const SHIP_SPEED = 1.7;',
      replace: 'export const SHIP_SPEED = 0.02;',
    },
  },
];
