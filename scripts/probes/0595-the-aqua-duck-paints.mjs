// The breaks behind docs/decisions/0595-the-aqua-duck-paints.md.
//
// One per guard tests/duck.test.ts adds, and the duck's own places in the suites that walk every ship.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'MMXXVI open from the first run, with nothing bought',
    guard: 'opens after five things bought at Cosmo’s, and the band counts them down',
    edit: { path: 'src/content/golfers.ts', find: '    opens: { after: [], crashes: 0, bought: 5 },', replace: '    opens: { after: [], crashes: 0, bought: 0 },' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'every ball straight ahead, a string that never scatters',
    guard: 'one ball a volley, a little off straight ahead and never all the same way, in every colour in the hopper',
    edit: { path: 'src/app/frame.ts', find: '  const angle = w.paintRng.range(-paint.scatter, paint.scatter);', replace: '  const angle = 0;' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'every ball the first colour in the hopper',
    guard: 'one ball a volley, a little off straight ahead and never all the same way, in every colour in the hopper',
    // Re-anchored by 0598, which draws out of what the place's hopper holds: the draw is never taken.
    edit: { path: 'src/app/frame.ts', find: '    if (nth-- === 0) {\n      colour = i;\n      break;\n    }\n', replace: '' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'a ball that lands and leaves no splat',
    guard: 'a ball that lands splats there, in its own colour, and the splat lands on a body beside the one it hit',
    edit: { path: 'src/app/frame.ts', find: '    if (splatHits !== null) splatPaint(w, splatHits);\n', replace: '' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    // The landing log keeps no kind, so every splat is read as the first colour.
    broke: 'a splat that forgets the colour of the ball that made it',
    guard: 'a ball that lands splats there, in its own colour, and the splat lands on a body beside the one it hit',
    edit: { path: 'src/sim/collide.ts', find: '        hits.kind[hits.count] = shot.kind;\n', replace: '' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    // The first frame of a splat in the row's own picture: a yellow ball splats pink until the next step.
    broke: 'a splat in the wrong colour on the step it lands',
    guard: 'a ball that lands splats there, in its own colour, and the splat lands on a body beside the one it hit',
    // Re-anchored by 0610: what is seen of a splat is the paint it leaves, which takes its colour here.
    edit: { path: 'src/app/frame.ts', find: '  const wet = paint.colours[mark.face]!.splat;', replace: '  const wet = SHOTS[gun.bursts].sprite;' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'a jet held straight ahead, sweeping nothing',
    guard: 'plays for two seconds from the gun, swinging both ways across the nose, and its last water flies on after it',
    // Re-anchored by 0598, which asks the sweep at the step the jet was laid at; and by 0616, which moved the sweep to the stream.
    edit: { path: 'src/sim/stream.ts', find: '  return sweep * Math.sin((Math.PI * 2 * clock) / period);', replace: '  return 0 * sweep * clock * period;' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'a second Water Cannon thrown over the first',
    guard: 'plays for two seconds from the gun, swinging both ways across the nose, and its last water flies on after it',
    edit: { path: 'src/app/frame.ts', find: '  if (row.jet !== null) return w.jetFor <= 0;\n', replace: '' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'a jet drawn and landing on nothing',
    guard: 'lands on a body off to the side that the gun would never reach, on its own clock',
    edit: { path: 'src/app/frame.ts', find: '    killedByShots += landJet(w, shootable, open, hull);\n', replace: '' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    // Drawn as the arc's flash, in the player's cyan, and not as water at all.
    broke: 'a jet painted as a bolt of lightning',
    // Re-named by 0610, which paints it as a spray: the break still draws it as lightning.
    guard: 'is painted as a spray as wide as it lands, opening from the nozzle to its tip, with its drops and mist, at its stated cost',
    edit: { path: 'src/render/scene.ts', find: '    if (e.kind === JET_BOLT_KIND) {', replace: '    if (e.kind === JET_BOLT_KIND && false) {' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'a jet outliving the ship that played it',
    guard: 'a life lost takes the jet with it',
    edit: { path: 'src/app/frame.ts', find: '  w.jetFor = 0;\n  w.jetKind = null;\n  w.jetAt = 0;\n', replace: '' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'the Water Cannon offered to a first-time player',
    guard: 'is on the bomb pickup only once MMXXVI is open',
    edit: { path: 'src/content/specials.ts', find: "    opensWith: 'mmxxvi',", replace: '    opensWith: null,' },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'Bubble Jets free on every ship from the first run',
    guard: 'the duck’s own, burned on another ship once both are won in, on the shells’ rule',
    edit: { path: 'src/content/flames.ts', find: "look: 'bubbles', from: 'duck' },", replace: "look: 'bubbles', from: null }," },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'the duck fitted with the standard flame as it comes',
    guard: 'the duck’s own, burned on another ship once both are won in, on the shells’ rule',
    edit: { path: 'src/content/ships.ts', find: 'livery: null, flame: row.flame, tubes: []', replace: "livery: null, flame: 'standard', tubes: []" },
  },
  {
    decision: '0595',
    suite: 'tests/duck.test.ts',
    broke: 'Bubble Jets drawn as a tongue of fire',
    guard: 'are drawn as bubbles — rings — where every other flame is a tongue of fire',
    edit: { path: 'src/render/bake.ts', find: "  if (FLAMES[flame].look === 'bubbles') {", replace: "  if (FLAMES[flame].look === 'bubbles' && false) {" },
  },
  {
    decision: '0595',
    suite: 'tests/dance.test.ts',
    broke: 'the duck dancing as it stands',
    guard: 'each pose is drawn, and is not the still ship again',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const bob = duckBobs(pose === 1 ? DUCK_DIP : pose === 2 ? DUCK_TIP : 0, pose === 2 ? DUCK_KICK : 0);',
      replace: '  const bob = duckBobs(0, 0);',
    },
  },
  {
    decision: '0595',
    suite: 'tests/mounts.test.ts',
    broke: 'the duck’s marker fired from somewhere it is not drawn',
    guard: 'THE ROWS ARE THE DRAWING',
    edit: { path: 'src/content/ships.ts', find: 'const DUCK_MUZZLE = wheelAt(17.2, 1.2, 0, 1);', replace: 'const DUCK_MUZZLE = wheelAt(15.2, 1.2, 0, 1);' },
  },
  {
    decision: '0595',
    suite: 'tests/layout.browser.test.ts',
    // The plates' faces as wide as they were for six: the seventh pushes the loadout off a 667x375.
    broke: 'seven pilots’ faces at six pilots’ width on a phone',
    guard: 'draws every control and word on each tab’s plate whole and inside it',
    edit: {
      path: 'src/app/chrome.ts',
      find: 'width: clamp(1.7rem, min(9cqh, 4.2cqw), 2.6rem); height: clamp(1.7rem, min(9cqh, 4.2cqw), 2.6rem); }',
      replace: 'width: clamp(1.9rem, min(9cqh, 4.5cqw), 2.6rem); height: clamp(1.9rem, min(9cqh, 4.5cqw), 2.6rem); }',
    },
  },
  {
    decision: '0595',
    suite: 'tests/level.test.ts',
    // The paintball on the jellyfish at four times its row's weight: through her phases faster than 0260 allows.
    broke: 'the jellyfish weighing the paintball far too heavily',
    guard: 'a real boss lasts forty seconds at max weapons, and every phase gets eight volleys away, so every attack is seen — the paintball',
    edit: {
      path: 'src/content/bosses.ts',
      // Re-anchored by 0609, which re-weighed the ram on the same row.
      find: '    gunWeights: { arc: 1.4, catherine: 0.5, ram: 2.4, paintball: 1.6 },',
      replace: '    gunWeights: { arc: 1.4, catherine: 0.5, ram: 2.4, paintball: 4 },',
    },
  },
];
