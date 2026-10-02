// The breaks behind docs/decisions/0437-the-title-is-lit.md.
//
// Both are one switch thrown the wrong way in each direction: the duplicate counts left on a phone,
// and the counts taken off a desktop that has nothing else saying them. The third, the mark on the
// golfers' screen, went with the mark — 0462.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0437',
    suite: 'tests/hud.browser.test.ts',
    broke: 'the readout told it is never on a touch screen, so a phone says each stack twice',
    guard: 'takes the stack counts off the glass on a touch screen',
    edit: {
      path: 'src/app/mount.ts',
      find: '  chrome.setTouch(touchable);',
      replace: '  chrome.setTouch(false);',
    },
  },
  {
    decision: '0437',
    suite: 'tests/hud.browser.test.ts',
    broke: 'the readout told it is always on a touch screen, so a desktop loses its stack counts',
    guard: 'and leaves them on the glass where there are no discs',
    edit: {
      path: 'src/app/mount.ts',
      find: '  chrome.setTouch(touchable);',
      replace: '  chrome.setTouch(true);',
    },
  },
];
