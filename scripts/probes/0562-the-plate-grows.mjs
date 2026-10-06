// The breaks behind docs/decisions/0562-the-plate-grows.md.
//
// ⚠️ The plate's type capped at a laptop's again, and the card left saying what it said before.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  // The growing plate's probe went with 0568, which turned the guard round; its probe is 0568's.
  {
    decision: '0562',
    suite: 'tests/foot.browser.test.ts',
    broke: 'the card never moved off the band it opened on',
    guard: 'names the option tried on',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    if (on !== undefined) panel.spoken = on;',
      replace: '    if (on === undefined) panel.spoken = on ?? panel.spoken;',
    },
  },
];
