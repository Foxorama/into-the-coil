// The breaks behind docs/decisions/0670-the-plate-from-the-short-side.md.
//
// ⚠️ Each puts back a measurement the review took: the plate's em pinned at a rem, its width let past a third, the
// keys' line at 9 px, a phone's tab and Fly under a thumb, the seventh face cut in half, and the plate's foot empty.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'the plate’s em pinned at 1 rem, the same form at 720 rows and 1080',
    guard: 'grows its type on a 1080-row desktop',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    font-size: clamp(0.78rem, calc(0.5rem + 0.97cqh), 1.4rem);',
      replace: '    font-size: clamp(0.78rem, 2.1cqh, 1rem);',
    },
  },
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'the plate’s width in its em with no cap, taking the stand’s room',
    guard: 'grows its type on a 1080-row desktop',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    grid-template-columns: minmax(0, min(25.4em, max(24rem, 33.3%))) minmax(0, 1fr);',
      replace: '    grid-template-columns: minmax(0, 40em) minmax(0, 1fr);',
    },
  },
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'the keys’ line at 0.62 em with no floor',
    guard: 'grows its type on a 1080-row desktop',
    edit: {
      path: 'src/app/chrome.ts',
      find: 'text-align: right; font-size: max(0.62em, 12px);',
      replace: 'text-align: right; font-size: 0.62em;',
    },
  },
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'Paint & Parts’ bands stood at the plate’s top over an empty foot',
    guard: 'grows its type on a 1080-row desktop',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  .itc-hangar-settings-box, .itc-parts-settings-box { grid-template-rows: auto auto auto 1fr; }',
      replace: '',
    },
  },
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'the hangar’s tabs drawn under a thumb on a touch phone',
    guard: 'draws every tab, chip, arrow and Fly at 44 px on a touch phone',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    .itc-hangar-tab, .itc-parts-tab, .itc-shop-tab { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }\n',
      replace: '',
    },
  },
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'Fly and the tiers drawn under a thumb on a touch phone',
    guard: 'draws every tab, chip, arrow and Fly at 44 px on a touch phone',
    edit: {
      path: 'src/app/chrome.ts',
      find: '    .itc-title-choices > .itc-title-action-lead, .itc-title-band:not(.itc-title-band-faces) .itc-title-option { min-height: 44px; }\n',
      replace: '',
    },
  },
  {
    decision: '0670',
    suite: 'tests/layout.browser.test.ts',
    broke: 'a face the track only partly shows, drawn in part',
    guard: 'shows a band of faces whole faces only',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      if (cut) face.style.visibility = 'hidden';\n",
      replace: '',
    },
  },
];
