// The breaks behind docs/decisions/0017-the-state-is-slices.md.
//
// ⚠️ **Two of these used to PLANT `src/state/slices/run.ts` and `src/state/root.ts`, because neither
// existed.** They do now — decision 0039 built them — and `npm run prove` refused both with *"a plant
// must create the file"* rather than passing quietly, which is the harness doing exactly its job.
//
// The sibling break is now a plant of a NEW slice reaching for the real one, which is the realistic
// version of it: nobody adds an importing slice to an empty directory, they add the second slice to a
// directory that already has one. The root break moved to `0039-run.mjs`, where it edits the real
// reducer instead of a fixture — a strictly stronger proof, and keeping a duplicate here would mean
// two probes claiming one guard.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0017',
    suite: 'tests/state-shape.test.ts',
    broke: 'a NEW slice reaching for the run slice next door, which is how the second one always arrives',
    guard: 'no slice imports a sibling slice',
    plant: {
      path: 'src/state/slices/level.ts',
      content: "import { type RunState } from './run.ts';\nexport type LevelOf = RunState['level'];\n",
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
