// The breaks behind docs/decisions/0669-one-cursor.md.
//
// ⚠️ One cursor, and each break puts a second one back or takes the one away: a ring drawn on a control the
// cursor is on, the brackets not drawn at all, the title's band skipping its locked pilots, and the line saying
// nothing of what opens one.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0669',
    suite: 'tests/chrome.test.ts',
    broke: 'a ring drawn round the title’s control under the cursor, beside the brackets',
    guard: 'the cursor is the brackets on every screen, and no cursor rule draws a ring',
    edit: {
      path: 'src/app/chrome.ts',
      find: '@keyframes itc-bracket-wide { to { inset: 0.2em; } }',
      replace: '@keyframes itc-bracket-wide { to { inset: 0.2em; } }\n.itc-title-action-cursor { outline: 3px solid currentColor; }',
    },
  },
  {
    decision: '0669',
    suite: 'tests/menu.browser.test.ts',
    broke: 'the brackets not drawn over a control the cursor is on',
    guard: 'draws a cursor on the control it would press',
    edit: {
      path: 'src/app/chrome.ts',
      find: "  content: '';\n  position: absolute;\n  inset: 0.08em;",
      replace: '  content: none;\n  position: absolute;\n  inset: 0.08em;',
    },
  },
  {
    decision: '0669',
    suite: 'tests/menu.browser.test.ts',
    // The title's band skipping every shut face again, so the cursor can never stand on one.
    broke: 'a step on the title’s pilot band skipping the locked pilots',
    guard: 'the cursor stands on a locked pilot on the title',
    edit: {
      path: 'src/app/chrome.ts',
      find: "    if (band.press === 'takes' && atCursor() === band.root) {",
      replace: '    if (false) {',
    },
  },
  {
    decision: '0669',
    suite: 'tests/menu.browser.test.ts',
    broke: 'the line under the faces saying the gun, not what opens the locked pilot looked at',
    guard: 'the cursor stands on a locked pilot on the title',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      if (looking) card.gun.textContent = band.whys[band.look] ?? band.why ?? '';\n",
      replace: '',
    },
  },
];
