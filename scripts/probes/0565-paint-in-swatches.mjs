// The breaks behind docs/decisions/0565-paint-in-swatches.md.
//
// ⚠️ Each of the three pictures taken away: the paints back to words, the tone drawn on the factory's
// paint again, and the wheels without the ship.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0565',
    suite: 'tests/swatches.browser.test.ts',
    broke: 'every paint the one colour',
    guard: 'draws every paint in a colour of its own',
    edit: {
      path: 'src/app/mount.ts',
      find: "chrome.setSwatches('livery', [null, ...HUES.map((_, hue) => liveryInk({ hue, tone }))], [colours.player, colours.space]);",
      replace: "chrome.setSwatches('livery', [null, ...HUES.map(() => colours.player)], [colours.player, colours.space]);",
    },
  },
  {
    decision: '0565',
    suite: 'tests/swatches.browser.test.ts',
    broke: 'the tone drawn on the factory’s paint, two arrows round nothing',
    guard: 'hides the tone on the factory’s paint',
    edit: {
      path: 'src/app/mount.ts',
      find: "    chrome.setBandShown('tone', paint !== null);",
      replace: "    chrome.setBandShown('tone', true);",
    },
  },
  {
    decision: '0565',
    suite: 'tests/swatches.browser.test.ts',
    broke: 'the wheels named and not pictured',
    guard: 'pictures the wheels',
    edit: {
      path: 'src/app/mount.ts',
      find: "    chrome.setThumbs('rim', RIM_KINDS.map((rim) => (SHIPS[ship].wheels === null ? null : thumbOf(ship, { ...base, rim }))));",
      replace: "    chrome.setThumbs('rim', RIM_KINDS.map(() => null));",
    },
  },
];
