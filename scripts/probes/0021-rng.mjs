// The breaks behind docs/decisions/0021-one-stream-per-concern.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`hashSeed` returning a constant',
    guard: 'hashes a string seed to a stable 32-bit value',
    edit: {
      path: 'src/sim/rng.ts',
      find: '  let h = 2166136261 >>> 0;',
      replace: '  let h = 2166136261 >>> 0;\n  return h;',
    },
  },
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`stream()` derived from a DRAW instead of from the name — the ported `fork()`',
    guard: 'derives a stream from its NAME, not from a draw',
    edit: {
      path: 'src/sim/rng.ts',
      find: '    return new Rng(hashSeed(`${this.seed}:${name}`));',
      replace: '    return new Rng(Math.floor(this.next01() * 0xffffffff));',
    },
  },
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`stream()` ignoring the name, so every concern shares one sequence',
    guard: 'gives distinct names distinct sequences',
    edit: {
      path: 'src/sim/rng.ts',
      find: '    return new Rng(hashSeed(`${this.seed}:${name}`));',
      replace: '    return new Rng(hashSeed(`${this.seed}:stream`));',
    },
  },
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`int()` made exclusive of `max`, so the last row of every table is unreachable',
    guard: 'makes int() inclusive at BOTH ends',
    edit: {
      path: 'src/sim/rng.ts',
      find: '    return Math.floor(this.range(min, max + 1));',
      replace: '    return Math.floor(this.range(min, max));',
    },
  },
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`gaussian()` reduced to a single draw',
    guard: 'always draws twice for a gaussian, whatever the arguments',
    edit: {
      path: 'src/sim/rng.ts',
      find: '    const u2 = this.next01();',
      replace: '    const u2 = 0.5;',
    },
  },
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`fork()` restored to the class',
    guard: 'has no fork affordance at all',
    edit: {
      path: 'src/sim/rng.ts',
      find: '  /** Float in [0, 1). */',
      replace: '  fork(): Rng {\n    return new Rng(Math.floor(this.next01() * 0xffffffff));\n  }\n\n  /** Float in [0, 1). */',
    },
  },
];
