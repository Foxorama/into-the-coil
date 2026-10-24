// The breaks behind docs/decisions/0561-the-cursor-tries-on.md.
//
// ⚠️ The way the ask comes undone: a step that fits again, which is the bug the player reported. Its second probe —
// a shut option skipped over, which hid what opens it — went with 0657, which hides a shut option on the player's word.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0561',
    suite: 'tests/tries.browser.test.ts',
    broke: 'a step along a slot fits the option again, as it did before the ask',
    guard: 'steps the gun band without fitting',
    edit: {
      path: 'src/app/chrome.ts',
      // Re-anchored by 0607, whose step comes round and so never stands on the option it left; and by 0657's skip.
      find: '      if (next !== from && band.hidden[next] !== true) tryOn(band, next, true);',
      replace: '      if (next !== from && band.hidden[next] !== true) onChoice(band.name, next, false);',
    },
  },
];
