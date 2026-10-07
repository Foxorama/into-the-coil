// The breaks behind docs/decisions/0580-the-key-opens.md.
//
// ⚠️ A sheet that says the wrong number reads as true: a seeker's life on another clock, a special put on no
// trigger, a thrown special's reach not said — and in the page, a face opening another face's sheet, the
// faces out of the walk, a ring left behind under the sheet, and a button's own font growing How to play
// past a phone's fold.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0580',
    suite: 'tests/key-opens.test.ts',
    broke: 'a seeker’s life counted on a clock of fifty steps a second',
    guard: 'says a missile’s hit in pulses and a seeker’s life in seconds',
    edit: { path: 'src/state/screens.ts', find: '(missile.fuse / STEPS_PER_SECOND)', replace: '(missile.fuse / 50)' },
  },
  {
    decision: '0580',
    suite: 'tests/key-opens.test.ts',
    broke: 'a special’s sheet naming no trigger to throw it with',
    guard: 'puts a special on its own trigger',
    edit: {
      path: 'src/state/screens.ts',
      find: 'return { title: special.label, said: special.hint, side: special.side, lines };',
      replace: 'return { title: special.label, said: special.hint, side: null, lines };',
    },
  },
  {
    decision: '0580',
    suite: 'tests/key-opens.test.ts',
    broke: 'a thrown special’s reach never said',
    guard: 'puts a special on its own trigger',
    edit: { path: 'src/state/screens.ts', find: 'if (special.shot !== null && special.reach > 0) {', replace: 'if (special.shot !== null && special.reach > 1000) {' },
  },
  {
    decision: '0580',
    suite: 'tests/key-opens.browser.test.ts',
    broke: 'every face opening its pickup’s first face’s sheet',
    guard: 'opens each face’s own sheet',
    edit: { path: 'src/app/chrome.ts', find: 'const press = (): void => open(pickup, face, sprite);', replace: 'const press = (): void => open(pickup, 0, sprite);' },
  },
  {
    decision: '0580',
    suite: 'tests/key-opens.browser.test.ts',
    broke: 'the faces left out of the cursor’s walk',
    guard: 'walks the keys onto the faces',
    edit: { path: 'src/app/chrome.ts', find: '  for (const key of keys) if (key.length > 0) rows.push([...key]);\n', replace: '' },
  },
  {
    decision: '0580',
    suite: 'tests/key-opens.browser.test.ts',
    broke: 'the face the cursor left still ringed under its sheet',
    guard: 'walks the keys onto the faces',
    edit: { path: 'src/app/chrome.ts', find: '    unring(panel, prefix);\n    panel.rows.splice(0, panel.rows.length, [close]);', replace: '    panel.rows.splice(0, panel.rows.length, [close]);' },
  },
  {
    decision: '0580',
    suite: 'tests/layout.browser.test.ts',
    broke: 'a face’s button in its own font, which grew every icon and scrolled How to play on a 480x320',
    guard: 'needs no scrolling on any of them',
    edit: { path: 'src/app/chrome.ts', find: 'font: inherit; line-height: 0; ', replace: '' },
  },
];
