// The breaks behind docs/decisions/0672-the-controls-are-a-table.md.
//
// ⚠️ Each puts back what the review found: the Controls tab a grid of twelve with Reset and Back among the
// bindings, and a band of two that a press on its chosen chip, or an arrow at its end, did nothing to.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0672',
    suite: 'tests/controls.browser.test.ts',
    broke: 'the Controls tab’s buttons left in their row’s order, a grid with Reset and Back among them',
    guard: 'stands each row’s name and its two cells on one line',
    edit: {
      path: 'src/app/chrome.ts',
      find: "    if (screen === 'controls') layControls(prefix, choices, controls);\n",
      replace: '',
    },
  },
  {
    decision: '0672',
    suite: 'tests/menu.browser.test.ts',
    broke: 'a click on the chip of two that is on choosing it again, flipping nothing',
    guard: 'a band of two is a switch',
    edit: {
      path: 'src/app/chrome.ts',
      find: '          onChoice(choice.name, flips ? 1 - index : target, true);',
      replace: '          onChoice(choice.name, target, true);',
    },
  },
  {
    decision: '0672',
    suite: 'tests/loadout-tabs.browser.test.ts',
    broke: 'a stand’s tabs taken for a switch, so a click on the open Loadout tab flips to Cockpit',
    guard: 'only the group whose tab is lit',
    edit: {
      path: 'src/app/chrome.ts',
      find: "          const tab = choice.name === 'section' || choice.name === 'aisle';",
      replace: '          const tab = false;',
    },
  },
];
