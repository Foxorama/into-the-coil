// A turn leaves nothing behind it — docs/decisions/0369-a-turn-leaves-nothing-behind-it.md
//
// Every guard 0369 adds, broken on purpose. `node scripts/prove-guard.mjs 0369`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0369',
    suite: 'tests/orientation.browser.test.ts',
    // ⚠️ THE CANVAS LEFT IN THE LAYOUT BEHIND THE GATE, which is what shipped: hidden, and still its
    // landscape width inside a portrait page, for WebKit to zoom and scroll out to.
    broke: 'the canvas left in the layout behind the gate, overflowing a portrait page',
    guard: 'THE REPORTED ONE: behind the gate the canvas takes no room, so there is nothing to zoom out to',
    edit: {
      path: 'src/app/mount.ts',
      find: "    canvas.style.display = playable ? 'block' : 'none';",
      replace: "    canvas.style.display = 'block';",
    },
  },
  {
    decision: '0369',
    suite: 'tests/orientation.browser.test.ts',
    // ⚠️ THE WINDOW'S RESIZE AS THE ONLY REPORT, which is what shipped: a turn WebKit reported early
    // was fitted to the size it had not settled at, and nothing measured again.
    broke: 'the window’s own resize the only report of a turn, so one it gets wrong is never fitted',
    guard: 'a turn the window’s own resize does not report is still fitted, from the visual viewport',
    edit: {
      path: 'src/app/mount.ts',
      find: "  window.visualViewport?.addEventListener('resize', onResize);",
      replace: '  void window.visualViewport;',
    },
  },
  {
    decision: '0369',
    suite: 'tests/orientation.browser.test.ts',
    // ⚠️ THE SCREEN RE-APPLIED ON EVERY RESIZE, which is what shipped: a toolbar sliding in put the
    // focus back on the first control, restarted a countdown and put out a burn.
    broke: 'the screen re-applied on every resize, so a toolbar sliding in is a screen change',
    guard: 'a resize while the game stays playable does not re-apply the screen',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (appliedPlayable !== playable) {',
      replace: '    if (appliedPlayable !== playable || playable) {',
    },
  },
];
