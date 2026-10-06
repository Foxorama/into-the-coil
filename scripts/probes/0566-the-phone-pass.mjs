// The breaks behind docs/decisions/0566-the-phone-pass.md.
//
// ⚠️ Portrait both ways: the hangar gated again as 0031 had it, and the gate left down on the title.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0566',
    suite: 'tests/upright.browser.test.ts',
    broke: 'the hangar gated in portrait, as everything was',
    guard: 'draws the hangar in portrait with no prompt',
    edit: {
      path: 'src/app/mount.ts',
      find: '  const standsTall = (): boolean => SCREENS[state.screen.current].stand !== null;',
      replace: '  const standsTall = (): boolean => SCREENS[state.screen.current].stand === undefined;',
    },
  },
  {
    decision: '0566',
    suite: 'tests/upright.browser.test.ts',
    broke: 'the gate left down when the hangar goes back to the title upright',
    guard: 'gates the title again on Back',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (moved && playable && measure().alongAxis !== 'x' && !standsTall()) setPlayable(false);",
      replace: "    if (moved && playable && measure().alongAxis !== 'x' && !standsTall() && Number.isNaN(0)) setPlayable(false);",
    },
  },
];
