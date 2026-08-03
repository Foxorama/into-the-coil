// The breaks behind docs/decisions/0017-the-state-is-slices.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0017',
    suite: 'tests/state-shape.test.ts',
    broke: '`src/state/slices/run.ts` importing `./meta.ts`',
    guard: 'no slice imports a sibling slice',
    plant: {
      path: 'src/state/slices/run.ts',
      content: "import { META } from './meta.ts';\nexport const RUN = META;\n",
    },
  },
  {
    decision: '0017',
    suite: 'tests/state-shape.test.ts',
    broke: '`src/state/root.ts` given a two-case `switch`',
    guard: 'the root reducer routes and does not decide',
    plant: {
      path: 'src/state/root.ts',
      content: [
        'export const reduce = (s: number, a: string): number => {',
        '  switch (a) {',
        "    case 'a':",
        '      return s + 1;',
        "    case 'b':",
        '      return s - 1;',
        '    default: {',
        '      return s;',
        '    }',
        '  }',
        '};',
        '',
      ].join('\n'),
    },
  },
  {
    decision: '0017',
    suite: 'tests/state-shape.test.ts',
    broke: '`new Map<string, number>()` in a slice',
    guard: 'state is plain data',
    plant: {
      path: 'src/state/slices/seen.ts',
      content: 'export const seen = new Map<string, number>();\n',
    },
  },
  {
    decision: '0017',
    suite: 'tests/state-shape.test.ts',
    broke: '`\\bclass\\s` added to the plain-data pattern',
    guard: 'the plain-data pattern catches',
    edit: {
      path: 'tests/state-shape.test.ts',
      find: '|\\bSymbol\\s*\\(/;',
      replace: '|\\bSymbol\\s*\\(|\\bclass\\s/;',
    },
  },
  {
    decision: '0017',
    suite: 'tests/state-shape.test.ts',
    broke: 'the self-exclusion removed from `isSiblingSlice`',
    guard: 'the sibling rule tells a sibling from the slice itself',
    edit: {
      path: 'tests/state-shape.test.ts',
      find: "return target.startsWith(`${SLICES_DIR}/`) && !target.startsWith(from.replace(/\\.ts$/, ''));",
      replace: 'return target.startsWith(`${SLICES_DIR}/`);',
    },
  },
];
