// The breaks behind docs/decisions/0579-the-loadout-has-tabs.md.
//
// ⚠️ A tab that hides a group can hide it for good: every way the plate could stop reaching a band — the
// hangar shown untabbed, a band under two tabs, a group never put away, a phone drawing only the lit tab, a
// step that changes nothing, the Loadout two to a row again — and the shop saying the tubes are fitted
// somewhere they are not.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0579',
    suite: 'tests/loadout-tabs.test.ts',
    broke: 'Hangin’ Out drawing every group under its heading again',
    guard: 'THE ASK: Hangin’ Out is tabbed',
    // Re-anchored by 0584, whose Paint & Parts is tabbed too: Hangin' Out's is the one before its camera's line.
    edit: {
      path: 'src/state/screens.ts',
      find: "  tabbed: true,\n  // 0548: the port's one camera, the pad",
      replace: "  tabbed: false,\n  // 0548: the port's one camera, the pad",
    },
  },
  {
    decision: '0579',
    suite: 'tests/loadout-tabs.test.ts',
    broke: 'the tubes under both tabs',
    guard: 'puts every slot band on a tabbed stand under exactly one tab',
    edit: { path: 'src/state/screens.ts', find: "{ label: 'Cockpit', bands: ['plate', 'dangle'] },", replace: "{ label: 'Cockpit', bands: ['plate', 'dangle', 'rack'] }," },
  },
  {
    decision: '0579',
    suite: 'tests/loadout-tabs.browser.test.ts',
    broke: 'a tab lit and every group still drawn',
    guard: 'draws every tab on the plate and only the group whose tab is lit',
    edit: { path: 'src/app/chrome.ts', find: '      panel.groups.forEach((box, i) => box.classList.toggle(away, i !== index));\n', replace: '' },
  },
  {
    decision: '0579',
    suite: 'tests/loadout-tabs.browser.test.ts',
    broke: 'a phone drawing only the lit tab, as it draws only the fitted chip',
    guard: 'draws every tab on the plate and only the group whose tab is lit',
    edit: {
      path: 'src/app/chrome.ts',
      // Re-anchored by 0584, which draws Paint & Parts' tabs by the same rule.
      find: "  .itc-hangar-plate .itc-hangar-settings-box > .itc-hangar-band:has([${SETTING_ATTR}='section']) .itc-hangar-option, .itc-parts-plate .itc-parts-settings-box > .itc-parts-band:has([${SETTING_ATTR}='section']) .itc-parts-option { display: block; }\n",
      replace: '',
    },
  },
  {
    decision: '0579',
    suite: 'tests/loadout-tabs.browser.test.ts',
    broke: 'a step of the tabs that brings nothing into view',
    guard: 'walks the keys from the pilots onto the tabs',
    edit: { path: 'src/app/mount.ts', find: '      sections[state.screen.current] = index;\n', replace: '' },
  },
  {
    decision: '0579',
    suite: 'tests/still.browser.test.ts',
    broke: 'a phone’s Loadout two bands to a row, which stood the plate taller than the other tabs',
    guard: 'stands the plate at one size on every tab',
    edit: {
      path: 'src/app/chrome.ts',
      find: 'grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); column-gap: min(0.6rem, 1.5cqw); }',
      replace: 'grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: min(0.6rem, 1.5cqw); }',
    },
  },
  {
    decision: '0579',
    suite: 'tests/tube-shop.test.ts',
    broke: 'Cosmo’s sending an owned tube to Paint & Parts, where it is not fitted',
    guard: 'is a band on Hangin’ Out under Loadout',
    edit: { path: 'src/state/screens.ts', find: "'Yours — fit it in the hangar'", replace: "'Yours — fit it in Paint & Parts'" },
  },
];
