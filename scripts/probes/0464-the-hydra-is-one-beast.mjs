// The breaks behind docs/decisions/0464-the-hydra-is-one-beast.md.
//
// Asked for: *"the hydra bosses heads and body are cool, but the extra heads don't really fit and blend
// into the body that well, can we smooth that out a lot more?"*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0464',
    suite: 'tests/hydra.test.ts',
    // No collar ever laid: every neck goes in behind the body again, its outline across the join.
    broke: 'no neck’s collar ever laid, so the body’s outline runs across every neck where it leaves the body',
    guard: 'THE ASK: every grown neck leaves the body IN FRONT of it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (collar < w.bossFront.size && collared(necks, k, w.steps - w.necksBorn[k]!)) {',
      replace: '    if (collar < 0 && collared(necks, k, w.steps - w.necksBorn[k]!)) {',
    },
  },
  {
    decision: '0464',
    suite: 'tests/hydra.test.ts',
    // The collar laid on the hull's centre: a second neck standing out of the middle of the body.
    broke: 'every collar laid on the hull’s centre rather than its neck’s root',
    guard: 'THE ASK: every grown neck leaves the body IN FRONT of it',
    edit: {
      path: 'src/app/frame.ts',
      find: '      placeAt(at, rootAlong, rootAcross, foldTurn(angle), fresh || fronting);',
      replace: '      placeAt(at, hull.along, hull.across, foldTurn(angle), fresh || fronting);',
    },
  },
  {
    decision: '0464',
    suite: 'tests/hydra.test.ts',
    // The collars drawn before the hull: the body over them, and its outline across every neck again.
    broke: 'the collars drawn under the body, so the outline they exist to cover is drawn over them',
    guard: 'THE ASK: every grown neck leaves the body IN FRONT of it',
    edit: {
      path: 'src/app/mount.ts',
      find: 'bossAura, bossBody, bossPool, bossFront, enemies',
      replace: 'bossAura, bossFront, bossBody, bossPool, enemies',
    },
  },
  {
    decision: '0464',
    suite: 'tests/hydra.test.ts',
    // The collar fading out before the neck has left the body: the outline shows through its end.
    broke: 'every collar fading out three knots early, inside the body, so the body’s outline crosses the neck where it is already gone',
    guard: 'AND IT COVERS THE JOIN, IN WORLD UNITS',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const out = Math.max(3, lastIn + 1);',
      replace: '  const out = Math.max(3, lastIn - 2);',
    },
  },
  {
    decision: '0464',
    suite: 'tests/hydra.test.ts',
    // A tile too small for the collar it carries: the bake cuts the neck's root off square.
    broke: 'the first collar’s tile shrunk to thirty units, smaller than the root it is drawn to',
    guard: 'AND IT COVERS THE JOIN, IN WORLD UNITS',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  hydraCollar0: 48,',
      replace: '  hydraCollar0: 30,',
    },
  },
  {
    decision: '0464',
    suite: 'tests/hydra.test.ts',
    // A pool with a slot fewer than the necks: the last neck to grow goes in behind the body.
    broke: 'the front pool a slot short of the hydra’s five necks',
    guard: 'every row’s necks fit the pool in front of the body',
    edit: {
      path: 'src/app/mount.ts',
      find: '  bossFront: 5,',
      replace: '  bossFront: 4,',
    },
  },
];
