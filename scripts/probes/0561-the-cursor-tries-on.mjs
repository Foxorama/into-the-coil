// The breaks behind docs/decisions/0561-the-cursor-tries-on.md.
//
// ⚠️ The two ways the ask comes undone: a step that fits again, which is the bug the player reported,
// and a shut option skipped over again, which hides what opens it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0561',
    suite: 'tests/tries.browser.test.ts',
    broke: 'a step along a slot fits the option again, as it did before the ask',
    guard: 'steps the gun band without fitting',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      if (next >= 0 && next < count) tryOn(band, next, true);',
      replace: '      if (next >= 0 && next < count) onChoice(band.name, next, false);',
    },
  },
  {
    decision: '0561',
    suite: 'tests/tries.browser.test.ts',
    broke: 'a shut option disabled again, so a step cannot stand on it',
    guard: 'stands on a shut gun',
    edit: {
      path: 'src/app/chrome.ts',
      find: "            buttons[i]!.setAttribute('aria-disabled', closed ? 'true' : 'false');",
      replace: "            buttons[i]!.setAttribute('aria-disabled', 'false');",
    },
  },
];
