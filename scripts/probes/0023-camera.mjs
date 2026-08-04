// The breaks behind docs/decisions/0023-the-long-axis-is-the-scroll-axis.md.
//
// Every one of these is a bug someone would actually write. Four of the six are the same mistake in
// different clothes: treating the device in front of you as the only device.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0023',
    suite: 'tests/camera.test.ts',
    broke: 'the dodge lane scaled with aspect, so a longer screen gets more room to dodge',
    guard: 'shows the same dodge room on every screen',
    edit: {
      path: 'src/sim/camera.ts',
      find: '    alongSpan,\n    acrossSpan: ACROSS_SPAN,',
      replace:
        '    alongSpan,\n    acrossSpan: ACROSS_SPAN * (alongSpan / (ACROSS_SPAN * REFERENCE_ASPECT)),',
    },
  },
  {
    decision: '0023',
    suite: 'tests/camera.test.ts',
    broke: 'aspect taken as width ÷ height, which is not invariant under rotation',
    guard: 'shows the identical view rotated',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  const long = Math.max(widthPx, heightPx);\n  const short = Math.min(widthPx, heightPx);',
      replace: '  const long = widthPx;\n  const short = heightPx;',
    },
  },
  {
    decision: '0023',
    suite: 'tests/camera.test.ts',
    broke: 'the upper clamp dropped, so an ultrawide sees half a level ahead',
    guard: 'clamps lookahead at both ends',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  const alongSpan = ACROSS_SPAN * clamp(long / short, MIN_ASPECT, MAX_ASPECT);',
      replace: '  const alongSpan = ACROSS_SPAN * Math.max(long / short, MIN_ASPECT);',
    },
  },
  {
    decision: '0023',
    suite: 'tests/camera.test.ts',
    broke: 'the fit taken as the LARGER ratio, which crops the world instead of letterboxing it',
    guard: 'never crops, and never stretches',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  const scale = Math.min(long / alongSpan, short / ACROSS_SPAN);',
      replace: '  const scale = Math.max(long / alongSpan, short / ACROSS_SPAN);',
    },
  },
  {
    decision: '0023',
    suite: 'tests/camera.test.ts',
    broke: 'spawns placed against the REFERENCE view rather than the widest one — the pop-in bug',
    guard: 'puts the spawn line beyond the widest view any device can have',
    edit: {
      path: 'src/sim/camera.ts',
      find: 'export const MAX_ALONG_SPAN = ACROSS_SPAN * MAX_ASPECT;',
      replace: 'export const MAX_ALONG_SPAN = ACROSS_SPAN * REFERENCE_ASPECT;',
    },
  },
  {
    decision: '0023',
    suite: 'tests/camera.test.ts',
    broke: 'the zero-size guard removed, so a hidden tab hands the renderer a NaN transform',
    guard: 'returns a drawable view for a viewport with no size',
    edit: {
      path: 'src/sim/camera.ts',
      find: '  if (!usable) {',
      replace: '  if (!usable && false) {',
    },
  },
  {
    // The orientation lock restored. This one guards a SHIPPED surface — an installed PWA keeps its
    // own copy of the manifest, so a wrong value here is not reachable by a deploy — and it had
    // never been probed, in either direction, in the whole time it said `landscape`.
    decision: '0023',
    suite: 'tests/shell.test.ts',
    broke: 'the manifest locked back to landscape, making portrait unreachable on an installed app',
    guard: 'installs unlocked, because both orientations are the game',
    edit: {
      path: 'public/manifest.webmanifest',
      find: '  "orientation": "any",',
      replace: '  "orientation": "landscape",',
    },
  },
];
