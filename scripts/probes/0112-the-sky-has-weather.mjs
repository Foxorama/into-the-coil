// The breaks behind docs/decisions/0112-the-sky-has-weather.md.
//
// ⚠️ THE FIRST IS THE AMENDMENT FAILING IN THE ONE DIRECTION THAT MATTERS. 0069's ceiling is relaxed
// here for the first time in the project's life, and what makes that a rule rather than a hole is
// that the thing it lets through is bounded from the OTHER side. If those bounds cannot be broken,
// the amendment is an exemption wearing a rule's clothes.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0112',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE CLOUD SHRUNK TOWARDS A BULLET, which is the whole risk of amending 0069. At four units a
      "cloud" is a soft blob about four bullets across moving at a ninth of the world's rate — and the
      clearance rule the mark layers are held to does not apply to it, because it is not a mark. This
      is the assertion that has to catch it, and nothing else in the repository can.
    */
    broke: 'the weather shrunk towards a bullet’s size, which is what 0069’s ceiling exists to refuse',
    guard: '0112 — and the one thing bigger than a bullet has no edge, is faint, and is furthest away',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const NEBULA_UNITS = { from: 18, to: 40 };',
      replace: 'const NEBULA_UNITS = { from: 4, to: 40 };',
    },
  },
  {
    decision: '0112',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ AND THE OTHER BOUND: weather drawn as boldly as the marks in front of it. It is the edit a
      hand makes when the clouds do not show up on the monitor they are testing on, and it turns the
      thing everything is found AGAINST into a thing competing with them.

      ⚠️ **The whole RANGE is moved and not just its top, and the first draft moved only the top.**
      The guard measures the boldest cloud `nebulaField` actually draws — seven samples out of the
      range, never its ceiling — so widening the range to 0.4 left the sampled maximum at 0.2 and
      `npm run prove` reported STILL GREEN. That is 0027 working in the probe rather than in the
      guard: a break written against the constant instead of against the picture.
    */
    broke: 'the weather drawn bolder than the faintest starfield, so the backdrop competes with the game',
    guard: '0112 — and the one thing bigger than a bullet has no edge, is faint, and is furthest away',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const NEBULA_ALPHA = { from: 0.1, to: 0.22 };',
      replace: 'const NEBULA_ALPHA = { from: 0.4, to: 0.6 };',
    },
  },
  {
    decision: '0112',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE WEATHER PUT IN FRONT OF THE STARS. Draw order is the only thing that decides what is in
      front of what (`src/render/scene.ts`), so a layer moved one place up the array is a cloud over
      the starfield — which reads as fog rather than as distance, and nothing about its size, alpha or
      depth has changed.
    */
    broke: 'the weather drawn after the starfields, so the furthest thing is in front of them',
    guard: '0112 — and the one thing bigger than a bullet has no edge, is faint, and is furthest away',
    edit: {
      path: 'src/app/mount.ts',
      find:
        '  { sprite: SPRITE.skyNebula, extent: SPRITE_EXTENT.skyNebula, depth: 0.09 },\n' +
        '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
      replace:
        '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },\n' +
        '  { sprite: SPRITE.skyNebula, extent: SPRITE_EXTENT.skyNebula, depth: 0.09 },',
    },
  },
  {
    decision: '0112',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE FOURTH LAYER ADDED AND THIS FILE NOT TOLD, which is the assertion 0078 left behind for
      exactly this day — and it is the reason the sky's guards index by SPRITE now rather than by
      position: a layer inserted at the back moved every one of them by one, and the first thing that
      reported was a starfield that appeared to have slowed down.
    */
    broke: 'a sky layer removed, so the count this file holds is a description of a sky that is gone',
    guard: 'moves both layers twice as fast as they shipped, which is what was asked for',
    edit: {
      path: 'src/app/mount.ts',
      /*
        ⚠️ RE-ANCHORED BY 0221: there are TWO sky arrays now and the weather line is in both, so this
        anchor stopped being unique. The line after it is `skyFar`, which a planet's sky does not have
        — so the pair names `SKY` and nothing else, and the break is unchanged.
      */
      find:
        '  { sprite: SPRITE.skyNebula, extent: SPRITE_EXTENT.skyNebula, depth: 0.09 },\n' +
        '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
      replace: '  { sprite: SPRITE.skyFar, extent: SPRITE_EXTENT.skyFar, depth: 0.33 },',
    },
  },
];
