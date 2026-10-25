// The breaks behind docs/decisions/0674-the-intro-is-a-setting.md.
//
// ⚠️ Each takes back one part of the band: the flight that ignores it, the save that forgets it, and the
// title's Fly that does not say which.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0674',
    suite: 'tests/run-ends.browser.test.ts',
    broke: 'First flight chosen and every flight still playing the intro, 0635 as it was',
    guard: 'the next goes straight in',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (flownThisVisit && !INTROS[state.settings.intro].everyFlight) {',
      replace: '    if (flownThisVisit && !INTROS.every.everyFlight) {',
    },
  },
  {
    decision: '0674',
    suite: 'tests/settings-kept.test.ts',
    broke: 'the intro not read back, so a reload is every flight again',
    guard: 'the intro is kept',
    edit: {
      path: 'src/save/settings.ts',
      find: '    intro: oneOf(INTRO_KINDS, doc.intro, base.intro),',
      replace: '    intro: base.intro,',
    },
  },
  {
    decision: '0674',
    suite: 'tests/layout.browser.test.ts',
    broke: 'Settings two to a column, so the sixth band is a third column and a touch phone scrolls',
    guard: 'needs no scrolling and draws every segment whole with the touch section up',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  grid-template-rows: repeat(3, auto);\n',
      replace: '  grid-template-rows: repeat(2, auto);\n',
    },
  },
  {
    decision: '0674',
    suite: 'tests/run-ends.browser.test.ts',
    broke: 'Fly saying nothing when the next flight goes straight in',
    guard: 'as Fly says',
    edit: {
      path: 'src/app/mount.ts',
      find: "    const said = straight ? 'Straight in' : '';",
      replace: "    const said = straight ? '' : '';",
    },
  },
];
