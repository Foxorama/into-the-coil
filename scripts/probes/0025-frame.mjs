// The breaks behind docs/decisions/0025-the-frame-budget-is-counted-not-timed.md.
//
// Every one of these ships. Each produces a game that looks entirely correct on a 60Hz desktop
// monitor held in landscape, which is the machine it would have been written on.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0025',
    suite: 'tests/loop.test.ts',
    broke: 'one step per frame, so the simulation runs at whatever rate the display does',
    guard: 'runs 60 steps a second whatever the display is doing',
    edit: {
      path: 'src/app/loop.ts',
      find: '  let steps = Math.floor(pending / STEP_MS);',
      replace: '  let steps = 1;',
    },
  },
  {
    decision: '0025',
    suite: 'tests/loop.test.ts',
    broke: 'the step cap removed, so a one-second stall asks for sixty steps — the spiral',
    guard: 'never runs more than MAX_STEPS however long the frame took',
    edit: {
      path: 'src/app/loop.ts',
      find: '  if (steps > MAX_STEPS) {',
      replace: '  if (steps > MAX_STEPS && false) {',
    },
  },
  {
    decision: '0025',
    suite: 'tests/loop.test.ts',
    broke: 'the dropped debt carried forward instead of discarded, which is what makes it a spiral',
    guard: 'discards the debt rather than carrying it',
    edit: {
      path: 'src/app/loop.ts',
      find: '    pending -= dropped * STEP_MS;',
      replace: '    dropped = dropped;',
    },
  },
  {
    decision: '0025',
    suite: 'tests/pool.test.ts',
    broke: 'a pool that grows when full — allocating at the densest moment of the game',
    guard: 'refuses rather than grows when it is full',
    edit: {
      path: 'src/sim/pool.ts',
      find: '    if (this.live >= this.slots.length) return null;',
      replace: '    if (this.live >= this.slots.length) this.slots[this.live] = this.slots[0];',
    },
  },
  {
    decision: '0025',
    suite: 'tests/pool.test.ts',
    broke: 'culling while walking the pool FORWARDS, so a release skips the entity swapped into it',
    guard: 'retires every expired entity in one pass',
    edit: {
      path: 'src/sim/entity.ts',
      find: '  for (let i = pool.size - 1; i >= 0; i--) {',
      replace: '  for (let i = 0; i < pool.size; i++) {',
    },
  },
  {
    decision: '0025',
    suite: 'tests/pool.test.ts',
    broke: 'the portrait sign flipped, so the level scrolls backwards in portrait and only there',
    guard: 'runs along UP and across RIGHT in portrait',
    edit: {
      path: 'src/render/surface.ts',
      find: '    : view.gutterAlong + (view.alongSpan - alongInView) * view.scale;',
      replace: '    : view.gutterAlong + alongInView * view.scale;',
    },
  },
  {
    decision: '0025',
    suite: 'tests/pool.test.ts',
    broke: 'the painter drawing the current position and ignoring alpha, which judders off 60Hz',
    guard: 'draws at the previous position at alpha 0 and the current one at alpha 1',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const along = e.prevAlong + (e.along - e.prevAlong) * alpha;',
      replace: '    const along = e.along;',
    },
  },
  {
    decision: '0025',
    suite: 'tests/budget.test.ts',
    broke: 'an allocation planted in the frame loop — the one thing the runtime half cannot see',
    guard: 'no hot file allocates',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const inView = along - cameraAlong;',
      replace: '    const inView = along - cameraAlong;\n    const point = { x: 0, y: 0, ...e };',
    },
  },
  {
    decision: '0025',
    suite: 'tests/budget.test.ts',
    broke: 'the painter drawing each entity twice, which the source scan cannot see',
    guard: 'draws exactly one call per live entity',
    edit: {
      path: 'src/render/scene.ts',
      find: '    surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);',
      replace:
        '    surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);\n' +
        '    surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);',
    },
  },
];
