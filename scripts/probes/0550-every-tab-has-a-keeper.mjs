// The breaks behind docs/decisions/0550-every-tab-has-a-keeper.md.
//
// A keeper on every tab, each tab's own and nobody else's, and a viewport in the back wall with the sky
// through it. Each put back as it was, or broken the way it would be broken.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // Cosmo on all three tabs again, as 0548 left it.
    broke: 'Cosmo at the counter on every tab',
    guard: 'draws each tab’s own keeper at the counter',
    edit: {
      path: 'src/render/port.ts',
      find: '    const row = KEEPERS[keeper];',
      replace: "    const row = KEEPERS['cosmo'];",
    },
  },
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // Two tabs naming one keeper.
    broke: 'Paint & Parts kept by Unity',
    guard: 'draws each tab’s own keeper at the counter',
    edit: {
      path: 'src/state/screens.ts',
      find: "      // 0550: MMXXVI, who paints it.\n      keeper: 'mmxxvi',",
      replace: "      // 0550: MMXXVI, who paints it.\n      keeper: 'unity',",
    },
  },
  /*
    The viewport's two probes went with its guard in 0568: the stars are the open bay's now, in the stand,
    and that is guarded by tests/stand.test.ts's 0568 test and broken by 0568's own probes. The viewport is
    still drawn, where the camera sees it, and is no longer something the camera must keep in view.
  */
  {
    decision: '0550',
    suite: 'tests/layout.browser.test.ts',
    // A keeper who only greets kept on a phone's plate, which put Back under the fold on Paint & Parts.
    broke: 'the greeting card on a phone’s plate',
    guard: 'needs no scrolling on any of them',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-shop-keeper-greets, .itc-hangar-keeper-greets, .itc-parts-keeper-greets { display: none; }\n',
      replace: '',
    },
  },
];
