// The breaks behind docs/decisions/0661-the-places-are-described.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0661',
    suite: 'tests/hud.browser.test.ts',
    // A run that flies into its first place unnamed again.
    broke: 'a run opening on a place nothing names',
    guard: 'THE ASK, IN PIXELS: a run opens naming its place',
    edit: {
      path: 'src/app/mount.ts',
      find: '    chrome.setArrival({ place: THEMES[opening].title, voyage: THEMES[opening].voyage, accent: THEMES[opening].glow[palette] });\n',
      replace: '',
    },
  },
  {
    decision: '0661',
    suite: 'tests/hud.browser.test.ts',
    // The room's places named and not described, as before.
    broke: 'the music room naming the places and saying nothing of them',
    guard: 'and the music room says every place’s line under its name',
    edit: {
      path: 'src/state/screens.ts',
      find: '({ label: THEMES[kind].title, hint: THEMES[kind].voyage })',
      replace: "({ label: THEMES[kind].title, hint: '' })",
    },
  },
];
