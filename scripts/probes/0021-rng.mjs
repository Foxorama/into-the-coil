// The breaks behind docs/decisions/0021-one-stream-per-concern.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0021',
    suite: 'tests/rng.test.ts',
    broke: '`hashSeed` returning a constant',
    guard: 'the string hash is stable and distinct per input',
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
    guard: 'a stream consumes nothing from its parent',
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
    guard: 'distinct names give distinct sequences',
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
    guard: 'the range is inclusive at both ends',
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
    guard: 'draw COUNT is part of the contract',
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
    guard: 'the affordance is removed, not deprecated',
    edit: {
      path: 'src/sim/rng.ts',
      find: '  /** Float in [0, 1). */',
      replace: '  fork(): Rng {\n    return new Rng(Math.floor(this.next01() * 0xffffffff));\n  }\n\n  /** Float in [0, 1). */',
    },
  },
];
