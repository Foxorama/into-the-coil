// The breaks behind docs/decisions/0624-the-triggers-step-the-pilot.md.
//
// ⚠️ The triggers are read, as edges, and what they ask for reaches the band on every screen that has one.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0624',
    suite: 'tests/menu.test.ts',
    broke: 'a held trigger asking for a pilot on every step',
    guard: 'steps the pilot one press at a time',
    edit: {
      path: 'src/app/menu.ts',
      find: '      ask.pilot = pilot !== 0 && pilot !== heldPilot && !spending ? pilot : 0;',
      replace: '      ask.pilot = pilot !== 0 && !spending ? pilot : 0;',
    },
  },
  {
    decision: '0624',
    suite: 'tests/menu.browser.test.ts',
    broke: 'the triggers read and heard by no screen',
    guard: 'the triggers step the pilot on the title and in the hangar',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (menuAsk.pilot !== 0) chrome.pilot(menuAsk.pilot);',
      replace: '    if (menuAsk.pilot !== 0) chrome.setDevice(\'pad\');',
    },
  },
];
