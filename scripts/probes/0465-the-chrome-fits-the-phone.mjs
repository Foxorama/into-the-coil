// The chrome fits the phone — docs/decisions/0465-the-chrome-fits-the-phone.md
//
// Every guard 0465 adds, broken on purpose. `node scripts/prove-guard.mjs 0465`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0465',
    suite: 'tests/hud.browser.test.ts',
    // The readout typeset against the width again: a phone wears the desktop's font at half the height.
    broke: 'the readout’s type sized by the width again',
    guard: 'THE ASK: the strip is under a tenth of a phone’s height',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  font: 600 clamp(0.75rem, 2.9cqh, 1.3rem)/1 system-ui, sans-serif;',
      replace: '  font: 600 clamp(0.95rem, 2.4vw, 1.3rem)/1 system-ui, sans-serif;',
    },
  },
  {
    decision: '0465',
    suite: 'tests/hud.browser.test.ts',
    // The desktop made smaller on the phone's account, which 0153 forbids: every phone still floors at 12 px and passes.
    broke: 'the desktop’s readout shrunk with the phone’s',
    guard: 'and the desktop’s is what it was',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  font: 600 clamp(0.75rem, 2.9cqh, 1.3rem)/1 system-ui, sans-serif;',
      replace: '  font: 600 clamp(0.75rem, 2.5cqh, 1.3rem)/1 system-ui, sans-serif;',
    },
  },
  {
    decision: '0465',
    suite: 'tests/hud.browser.test.ts',
    // The disc back at 0.17: three of them are 58 % of a 390 px phone's height again.
    broke: 'the disc put back at 0.17 of the short edge',
    guard: 'the column under half the height',
    edit: {
      path: 'src/app/touch.ts',
      find: '  size: 0.12,',
      replace: '  size: 0.17,',
    },
  },
  {
    decision: '0465',
    suite: 'tests/hud.browser.test.ts',
    // No floor: on the smallest phone the disc is 38 px, under a fingertip.
    broke: 'the thumb’s floor taken off the disc',
    guard: '44 to 66 px each',
    edit: {
      path: 'src/app/touch.ts',
      find: '  min: 44,',
      replace: '  min: 0,',
    },
  },
];
