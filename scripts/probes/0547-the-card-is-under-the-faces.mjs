// The breaks behind docs/decisions/0547-the-card-is-under-the-faces.md.
//
// Reported: at 667x375 the hangar's pilot card showed "Bac" and "they/", beside the faces in the 39
// pixels they left. The card goes under the faces on a phone; the guard holds every word and control on
// a standing tab's plate whole and inside it. Broken once as reported, and once at the plate's edge.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0547',
    suite: 'tests/layout.browser.test.ts',
    // The card back beside the faces on a phone, in what the roster leaves: the reported picture.
    broke: 'the pilot card beside the faces on a phone, cut by its own edge',
    guard: 'draws every control and word on each tab’s plate whole and inside it, for every pilot, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  */\n  .itc-hangar-pilot-card { grid-column: 1 / -1; }\n  .itc-hangar-pilot-card .itc-hangar-pilot-words',
      replace: '  */\n  .itc-hangar-pilot-card .itc-hangar-pilot-words',
    },
  },
  {
    decision: '0547',
    suite: 'tests/layout.browser.test.ts',
    // 0539's own first build: the tabs at their desktop width on a phone, the strip run off the plate.
    broke: 'the tabs as wide on a phone as on a desktop, the last one past the plate',
    guard: 'draws every control and word on each tab’s plate whole and inside it, for every pilot, on every device',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-hangar-tab, .itc-parts-tab, .itc-shop-tab { padding: 0.3em 0.55em 0.25em; }',
      replace: '  .itc-hangar-tab, .itc-parts-tab, .itc-shop-tab { padding: 0.3em 1.6em 0.25em; }',
    },
  },
];
