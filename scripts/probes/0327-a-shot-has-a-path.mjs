// A shot has a path — docs/decisions/0327-a-shot-has-a-path.md
//
// Every guard 0327 adds, broken on purpose. `node scripts/prove-guard.mjs 0327`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // The bend step never called: every row's path is a promise the frame does not keep, and the
    // ripple flies the straight line its muzzle gave it.
    broke: 'the bend step removed from the frame, so a path on a row moves nothing',
    guard: 'THE PICTURE: a ripple swings across the lane on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '    bendShots(w);\n    stepEntities(w.enemyShots, w.cameraAlong);',
      replace: '    stepEntities(w.enemyShots, w.cameraAlong);',
    },
  },
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // The spray arm dealing every shot the same hand: the pair snakes in step, and a braid is two
    // shots on one curve.
    broke: 'the spray arm dealing one handedness, so the picket’s pair snakes in step rather than braiding',
    guard: 'THE PICTURE: a ripple swings across the lane on the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '          shot.spin = s % 2 === 0 ? 1 : -1;',
      replace: '          shot.spin = 1;',
    },
  },
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // The sweep ignored: a curl turns for ever, which is a bullet that orbits inside the view and
    // holds its pool slot until the pool refuses the volley after it.
    broke: 'the arc’s sweep ignored, so a curl never straightens and never leaves',
    guard: 'THE OTHER PICTURE: a curl turns through its sweep, then flies straight, then is gone',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (shot.firePhase >= path.sweep) break;\n',
      replace: '',
    },
  },
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // The arc turning the WORLD velocity rather than the camera-frame one: the scroll is bent into
    // the shot, and a curl's heading in the camera's frame keeps drifting after its sweep.
    broke: 'the arc rotating the world velocity, so the scroll is bent into the shot',
    guard: 'THE OTHER PICTURE: a curl turns through its sweep, then flies straight, then is gone',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const along = shot.velAlong - w.scrollPerStep;\n        const across = shot.velAcross;\n        const c = Math.cos(path.turn * hand);\n        const s = Math.sin(path.turn * hand);\n        shot.velAlong = along * c - across * s + w.scrollPerStep;',
      replace: '        const along = shot.velAlong;\n        const across = shot.velAcross;\n        const c = Math.cos(path.turn * hand);\n        const s = Math.sin(path.turn * hand);\n        shot.velAlong = along * c - across * s;',
    },
  },
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // The picket back on the spit: no row any level sends flies the wave, and the arm is a member
    // nobody flies.
    broke: 'the picket put back on the spit, so no level sends a shot that swings',
    guard: 'every path arm is on a row some level sends',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    shot: 'ripple',",
      replace: "    shot: 'spit',",
    },
  },
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // A curl on a radius wider than the lane: a straight line to the player, and a slot held for
    // the whole sweep for nothing.
    broke: 'the curl’s turn cut to a hundredth, so its circle is wider than the lane',
    guard: 'a row that bends bends inside the lane',
    edit: {
      path: 'src/content/shots.ts',
      find: "    path: { kind: 'arc', turn: 0.05, sweep: Math.PI },",
      replace: "    path: { kind: 'arc', turn: 0.01, sweep: Math.PI },",
    },
  },
  {
    decision: '0327',
    suite: 'tests/shot-path.test.ts',
    // Every shot the levels send given a path: the straight bullet is gone, which is the
    // over-correction the answer named.
    broke: 'the lance given a wave, so more of what the levels send bends than flies straight',
    guard: 'and most of what is sent still flies straight',
    edit: {
      path: 'src/content/shots.ts',
      find: "  lance: { sprite: SPRITE.lance, spriteHit: SPRITE.lance, radius: 0.9, health: 1, damage: 1, speed: 1.6, fission: SPENT_BY_ARRIVING },",
      replace:
        "  lance: { sprite: SPRITE.lance, spriteHit: SPRITE.lance, radius: 0.9, health: 1, damage: 1, speed: 1.6, fission: SPENT_BY_ARRIVING, path: { kind: 'wave', amplitude: 6, wavelength: 40 } },",
    },
  },
];
