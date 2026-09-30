// The breaks behind docs/decisions/0418-the-heart-lets-go.md.
//
// One per claim: the run's end going straight to the victory screen, the finale not skippable, the
// chosen golfer found in their own rescue, lines typed too slowly to be read, a voice blipping on
// spaces, two golfers with one voice, the Viper out before the heart bursts, the ships still on screen
// as it fades, no surge on a launch, and the title playing the last level's music after a win.
//
// ⚠️ Two claims are gone with what they held — docs/decisions/0426: the jellyfish melting off the heart
// (she dies in the fight now, and the finale starts after) and the cockpit close-ups (there are none).
// The Viper, the leaving and the surge are re-anchored on the one-shot painter, breaking what they broke.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0418',
    suite: 'tests/run.test.ts',
    broke: 'the run ending straight on the victory screen, with no finale',
    guard: 'a level cleared past the last one IS the end of the run',
    edit: {
      path: 'src/state/root.ts',
      find: "const SHOW_FINALE: ScreenAction = { slice: 'screen', type: 'show', screen: 'outro' };",
      replace: "const SHOW_FINALE: ScreenAction = { slice: 'screen', type: 'show', screen: 'victory' };",
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'a finale with no Skip',
    guard: 'has no panel, steps nothing, skips, and expires into the victory screen',
    edit: {
      path: 'src/state/screens.ts',
      find: "    timeout: { steps: OUTRO_STEPS, then: 'victory' },\n    pushed: false,\n    skips: true,",
      replace: "    timeout: { steps: OUTRO_STEPS, then: 'victory' },\n    pushed: false,\n    skips: false,",
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the golfer flying the fighter found in the Viper as well',
    guard: 'is any golfer but the one flying',
    edit: {
      path: 'src/content/golfers.ts',
      find: '  return GOLFER_KINDS.filter((kind) => kind !== chosen);',
      replace: '  return GOLFER_KINDS.filter(() => chosen !== null);',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'lines typed so slowly they are gone before they are read',
    guard: 'gives every golfer lines of their own',
    edit: {
      path: 'src/content/finale.ts',
      find: 'export const LETTER_STEPS = 2;',
      replace: 'export const LETTER_STEPS = 5;',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'a voice that blips on the gaps between words',
    guard: 'blips on the letters of a line and never on its spaces',
    edit: {
      path: 'src/content/finale.ts',
      find: "  return line[said - 1] !== ' ';",
      replace: '  return true;',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'Larry talking in Feather’s voice',
    guard: 'gives every golfer a voice of their own',
    edit: {
      path: 'src/content/golfers.ts',
      find: '    voice: 0.8,',
      replace: '    voice: 1.14,',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the Viper out of the heart before it has burst',
    guard: 'races the heart, sets it on fire, and bursts it',
    edit: {
      path: 'src/render/finale.ts',
      find: '  if (!alive) paintViper(surface, view, t, from);',
      replace: '  paintViper(surface, view, t, from);',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the two ships leaving too slowly to be gone when the picture goes',
    guard: 'has both ships leave the widest screen before the picture goes',
    edit: {
      path: 'src/content/finale.ts',
      find: '  const d = t - go;\n  return 0.5 * LAUNCH_ACCEL * d * d;',
      replace: '  const d = t - go;\n  return 0.1 * LAUNCH_ACCEL * d * d;',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the Viper’s launch heard with no surge seen',
    guard: 'plays every cue on a step that draws its twin',
    edit: {
      path: 'src/render/finale.ts',
      find: '      if (surge > 0) put(surface, view, PORT_BASE + PORT_SPRITE.viperSurge, along, across, surge, turn, VIPER_GROW);\n',
      replace: '',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the title playing the last level’s music after a win — the report',
    guard: 'plays the title’s music on every screen off a run',
    edit: {
      path: 'src/app/music.ts',
      find: "  return SCREENS[screen].inRun ? placeFor(runLevel) : 'approach';",
      replace: '  return placeFor(runLevel);',
    },
  },
];
