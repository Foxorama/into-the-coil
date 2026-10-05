// The breaks behind docs/decisions/0548-the-hangar-holds-still.md.
//
// The hangar's three tabs at one plate and one room, the pad's cursor kept on the strip and on the open tab,
// the shoulders shown on it, and the pilots on Cosmo's. Each put back as it was.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0548',
    suite: 'tests/still.browser.test.ts',
    // The plate centred on its own height again, each tab's another size.
    broke: 'the plate its content’s height on each tab',
    guard: 'stands the plate at one size on every tab',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  min-width: 0;\n  max-height: 100%;\n}',
      replace: '  min-width: 0;\n  align-self: center;\n  max-height: 100%;\n}',
    },
  },
  {
    decision: '0548',
    suite: 'tests/still.browser.test.ts',
    // A tab opened from the strip sends the cursor to its first band, as it did.
    broke: 'the cursor leaving the strip when a tab opens',
    guard: 'walks a pad from Cosmo’s back to Hangin’ Out',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        cursor.row = fromStrip && panel.tabs.length > 0 ? 0 : kept',
      replace: '        cursor.row = fromStrip && panel.tabs.length < 0 ? 0 : kept',
    },
  },
  {
    decision: '0548',
    suite: 'tests/still.browser.test.ts',
    // Up into the strip onto the tab standing nearest above, as it did.
    broke: 'up into the strip landing on the nearest tab',
    guard: 'walks a pad from Cosmo’s back to Hangin’ Out',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    cursor.col = Math.max(0, SCREENS[shownScreen].tabs.indexOf(shownScreen));',
      replace: '',
    },
  },
  {
    decision: '0548',
    suite: 'tests/still.browser.test.ts',
    // The shoulders never shown, whatever is in hand.
    broke: 'LB and RB not shown with a pad in hand',
    guard: 'walks a pad from Cosmo’s back to Hangin’ Out',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      for (const key of tabKeys) key.hidden = device !== 'pad';",
      replace: '',
    },
  },
  {
    decision: '0548',
    suite: 'tests/still.browser.test.ts',
    // Cosmo's without the pilots, as it was.
    broke: 'no pilot band on Cosmo’s',
    guard: 'changes the pilot on Cosmo’s',
    edit: {
      path: 'src/state/screens.ts',
      find: "      {\n        name: 'pilot',\n        label: 'Pilot',\n        options: pilotOptions,\n        faces: 'portraits',\n        card: 'line',\n        on: 'all',\n        press: 'steps',\n      },\n      {\n        name: 'aisle',",
      replace: "      {\n        name: 'aisle',",
    },
  },
];
