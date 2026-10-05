// The breaks behind docs/decisions/0538-the-title-is-composed.md.
//
// Asked for: *"The main menu is a pure mess at the moment with stuff everywhere."* The title is two
// plates now, Fly leads alone over a quiet row, and the card under the faces is a line. One guard is
// new — the plates' cuts — and the walk's guards were re-recorded; these show each still fires.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0538',
    suite: 'tests/layout.browser.test.ts',
    // The phone's cut put back to the desktop's, where the measured first build had it.
    broke: 'the plates cut as deep on a phone as on a desktop, so Settings and the faces lose their rings',
    guard: 'keeps every control, ring and all, out of its plate’s cut corners',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-title-main, .itc-title-board { --itc-cut: 0.45em; }',
      replace: '  .itc-title-main, .itc-title-board { --itc-cut: 0.9em; }',
    },
  },
  {
    decision: '0538',
    suite: 'tests/menu.browser.test.ts',
    // The cursor opening on the last row's first stop, as it did while the actions were one row.
    broke: 'the title opening on the quiet row’s chip, so a returning player’s first press steps the continues',
    guard: '0458 — walks the title by rows',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        const opens = choosing ? bandsFrom : actionRow >= 0 ? actionRow : panel.rows.length - 1;',
      replace: '        const opens = choosing ? bandsFrom : panel.rows.length - 1;',
    },
  },
  {
    decision: '0538',
    suite: 'tests/menu.browser.test.ts',
    // A row of one stepped round its own end, which is a push that does nothing.
    broke: 'right on Fly stepping a row of one round to itself, a dead axis',
    guard: 'still steps a column when the layout has no answer for the axis',
    edit: {
      path: 'src/app/chrome.ts',
      find: "        if ((axis === 'x' && row.length > 1) || rows.length === 1) {",
      replace: "        if (axis === 'x' || rows.length === 1) {",
    },
  },
  {
    decision: '0538',
    suite: 'tests/menu.browser.test.ts',
    // The walk not told that Fly leads, so the cursor walks one row of four the stylesheet draws as two.
    broke: 'the walk reading the actions as one row while the screen draws Fly over the quiet row',
    guard: '0458 — walks the title by rows',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  const lead = leads ? controls[0] : undefined;',
      replace: '  const lead = undefined;',
    },
  },
];
