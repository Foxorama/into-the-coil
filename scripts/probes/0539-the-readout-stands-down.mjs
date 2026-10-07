// The breaks behind docs/decisions/0539-the-readout-stands-down.md.
//
// Asked for: *"the dashboard display should be down in the shop and hanger section not the top left."*
// The hangar's tabs stand in the port: a stand with the dash, a plate with the rest. The readout is moved
// into the dash and counts what the run opens with. Each half broken on its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0539',
    suite: 'tests/stand.browser.test.ts',
    // The readout left where a run puts it, top left, over the hangar.
    broke: 'the readout never moved into the stand, so it stands in the play corner over the hangar',
    guard: 'is in each tab’s dash, whole, in its stand and clear of the plate, at every size',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        if (hud.parentElement !== standing) standing.appendChild(hud);',
      replace: '',
    },
  },
  /*
    ⚠️ **THE ONE-LINE DASH'S PROBE IS GONE — 0572.** It kept the readout on one line, which ran under the
    plate when the dash stood in a third of a tablet's stand. Since 0572 the monitor is centred under the
    ship and may take most of the stand, and on one line the readout fits at every size the guard holds:
    the probe stayed green here and on CI (0019). The wrap rule stays as a fallback; nothing at these
    sizes can show it doing anything.
  */
  {
    decision: '0539',
    suite: 'tests/stand.browser.test.ts',
    // The counts of the run that is not running, as the hangar showed before.
    broke: 'the dash counting the last run rather than the one the pilot would open',
    guard: 'counts what the run would open with',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (SCREENS[state.screen.current].stand !== null) {',
      replace: '    if (SCREENS[state.screen.current].stand === undefined) {',
    },
  },
  {
    decision: '0539',
    suite: 'tests/stand.browser.test.ts',
    // The readout left on the stand when the screen goes.
    broke: 'the readout left in the hangar’s dash, so the run flies with no readout in its corner',
    guard: 'counts what the run would open with',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        strip.prepend(hud);',
      replace: '',
    },
  },
];
