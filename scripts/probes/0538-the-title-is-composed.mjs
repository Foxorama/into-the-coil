// The breaks behind docs/decisions/0538-the-title-is-composed.md.
//
// Asked for: *"The main menu is a pure mess at the moment with stuff everywhere."* The title is two
// plates now, Fly leads alone over a quiet row, and the card under the faces is a line. One guard is
// new — the plates' cuts — and the phone's one-row guard was amended to the quiet row.
//
// ⚠️ Three more were written first, for a walk that split Fly from the quiet row, and the one that took
// the split away stayed GREEN: inside a row of buttons the boxes already decide (0214). The walk was put
// back as it was, and those probes went with it — the decision has the account.

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
    suite: 'tests/layout.browser.test.ts',
    // Fly not marked, so the stylesheet draws it as one of the quiet row.
    broke: 'Fly not marked as the action that leads, so it stands in the quiet row at the quiet row’s size',
    guard: 'keeps the title’s choices in one row on a phone',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      if (row.leads && index === 0) control.classList.add(prefix + 'action-lead');",
      replace: '',
    },
  },
];
