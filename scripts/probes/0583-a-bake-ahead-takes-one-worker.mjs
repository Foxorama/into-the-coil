// The breaks behind docs/decisions/0583-a-bake-ahead-takes-one-worker.md.
//
// One per claim: a bake ahead that sends every layer at once, a hurry that sends nothing, and a stopped
// bake that keeps feeding the pool.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0583',
    suite: 'tests/sound.test.ts',
    broke: 'a bake ahead sending every layer to the pool at once',
    guard: '0583 — A BAKE AHEAD KEEPS ONE LAYER ON THE POOL',
    edit: {
      path: 'src/app/sound.ts',
      find: '  let inFlight = ahead ? AHEAD_IN_FLIGHT : Number.POSITIVE_INFINITY;\n',
      replace: '  let inFlight = Number.POSITIVE_INFINITY;\n',
    },
  },
  {
    decision: '0583',
    suite: 'tests/sound.test.ts',
    broke: 'a hurry that leaves the rest of a bake ahead held back',
    guard: '0583 — A BAKE AHEAD KEEPS ONE LAYER ON THE POOL',
    edit: {
      path: 'src/app/sound.ts',
      find: '    hurry: () => {\n      inFlight = Number.POSITIVE_INFINITY;\n',
      replace: '    hurry: () => {\n',
    },
  },
  {
    decision: '0583',
    suite: 'tests/sound.test.ts',
    broke: 'a stopped bake that keeps sending layers to the pool',
    guard: '0583 — A BAKE AHEAD KEEPS ONE LAYER ON THE POOL',
    edit: {
      path: 'src/app/sound.ts',
      find: '    while (!stopped && out < inFlight && sends.length > 0) {\n',
      replace: '    while (out < inFlight && sends.length > 0) {\n',
    },
  },
];
