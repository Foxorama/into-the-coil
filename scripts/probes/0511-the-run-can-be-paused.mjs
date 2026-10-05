// The breaks behind docs/decisions/0511-the-run-can-be-paused.md.
//
// ⚠️ A pause that stops the world and not the audio clock is the failure the decision is about, and it
// is invisible on the page: the run looks paused and comes back with its volleys off the beat. So the
// breaks below are each one way the clock gets away from a held run, beside the ways in and out of it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0511',
    suite: 'tests/pause.browser.test.ts',
    broke: 'a pause that stops the world and leaves the audio clock running',
    guard: 'Escape pauses and holds the audio clock',
    edit: {
      path: 'src/app/mount.ts',
      find: '    audioOut.hold(held);',
      replace: '    audioOut.hold(false);',
    },
  },
  {
    decision: '0511',
    suite: 'tests/pause.browser.test.ts',
    broke: 'a press on the pause resuming the audio clock under the held run',
    guard: 'Escape pauses and holds the audio clock',
    edit: {
      path: 'src/app/sound.ts',
      find: "      if (ctx.state === 'suspended' && !held) void ctx.resume();",
      replace: "      if (ctx.state === 'suspended') void ctx.resume();",
    },
  },
  {
    decision: '0511',
    suite: 'tests/pause.browser.test.ts',
    broke: 'the music room offered under a held run, to walk a level over its field',
    guard: 'Settings from a pause has no music room',
    edit: {
      path: 'src/app/mount.ts',
      find: "    chrome.setActionShown('settings', 0, !held);",
      replace: "    chrome.setActionShown('settings', 0, true);",
    },
  },
  {
    decision: '0511',
    suite: 'tests/pause.browser.test.ts',
    broke: 'a hidden tab left running, its music free of the run',
    guard: 'a hidden tab pauses the run',
    edit: {
      path: 'src/app/mount.ts',
      find: "  document.addEventListener('visibilitychange', onHidden);",
      replace: '',
    },
  },
  {
    decision: '0511',
    suite: 'tests/pause.browser.test.ts',
    broke: 'a quit thrown away rather than kept on the table',
    guard: 'a quit is kept on the table',
    edit: {
      path: 'src/app/mount.ts',
      find: '        recordRun(false);\n        // 0522: and a quit',
      replace: '        // 0522: and a quit',
    },
  },
  {
    decision: '0511',
    suite: 'tests/menu.test.ts',
    broke: 'Settings opened from a pause going back to the title with the run held',
    guard: 'remembers a pause that opened it',
    edit: {
      path: 'src/state/slices/screen.ts',
      find: "      const inside = from === 'opener' || (from !== null && SCREENS[from].back === 'opener');",
      replace: '      const inside = from !== null;',
    },
  },
  {
    decision: '0511',
    suite: 'tests/pad.test.ts',
    broke: 'a held Start asking for a pause on every step',
    guard: 'held asks no more',
    edit: {
      path: 'src/app/pad.ts',
      find: '      if (pauseDown && !pauseWasDown && !spending && onPause !== undefined) onPause();',
      replace: '      if (pauseDown && !spending && onPause !== undefined) onPause();',
    },
  },
  {
    decision: '0511',
    suite: 'tests/pad.test.ts',
    broke: 'the Start that resumed the run heard again by the run, and pausing it',
    guard: 'held through the count-in into the run is not a second pause',
    edit: {
      path: 'src/app/pad.ts',
      find: '      if (pauseDown && !pauseWasDown && !spending && onPause !== undefined) onPause();',
      replace: '      if (pauseDown && !pauseWasDown && onPause !== undefined) onPause();',
    },
  },
];
