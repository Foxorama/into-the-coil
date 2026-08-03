// The breaks behind docs/decisions/0015-the-layer-ladder.md.
//
// A probe is DATA in a file, never a string a shell has to survive — that is the whole point of the
// harness. `broke` is the left column of the decision's table; `guard` is the substring of the test
// title that must go red, so a probe that reddens something else is reported as a failure rather
// than counted as a success.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: '`src/sim/step.ts` importing `../render/hud.ts`',
    guard: 'no module imports a layer it was not given',
    plant: {
      path: 'src/sim/step.ts',
      content: "import { paint } from '../render/hud.ts';\nexport const step = () => paint();\n",
    },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: '`Math.random()` in `src/sim/step.ts`',
    guard: 'no layer reaches for a capability it was not granted',
    plant: { path: 'src/sim/step.ts', content: 'export const roll = () => Math.random();\n' },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: '`performance.now()` in `src/render/hud.ts`',
    guard: 'no layer reaches for a capability it was not granted',
    plant: { path: 'src/render/hud.ts', content: 'export const t = () => performance.now();\n' },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: "`import { readFileSync } from 'node:fs'` in `src/sim/`",
    guard: 'src/ imports nothing from outside src/',
    plant: {
      path: 'src/sim/step.ts',
      content: "import { readFileSync } from 'node:fs';\nexport const r = readFileSync;\n",
    },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: 'a planted `src/audio/` directory',
    guard: 'every directory under src/ is a declared layer',
    plant: { path: 'src/audio/cue.ts', content: 'export const CUE = 1;\n' },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: 'a planted `src/loot.ts`',
    guard: 'every file at the root of src/ is declared',
    plant: { path: 'src/loot.ts', content: 'export const LOOT = 1;\n' },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: "`brand`'s `mayImport` set to `['app']`",
    guard: 'the arrow points one way',
    edit: { path: 'tests/layering.test.ts', find: 'mayImport: [],', replace: "mayImport: ['app']," },
  },
  {
    decision: '0015',
    suite: 'tests/layering.test.ts',
    broke: 'the `random` pattern typo\'d to `Math\\.randon`',
    guard: 'every capability pattern matches its own sample',
    edit: { path: 'tests/layering.test.ts', find: 'pattern: /Math\\.random|', replace: 'pattern: /Math\\.randon|' },
  },
];
