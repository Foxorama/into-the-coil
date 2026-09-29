// The breaks behind docs/decisions/0418-the-heart-lets-go.md.
//
// One per claim: the run's end going straight to the victory screen, the finale not skippable, the
// chosen golfer found in their own rescue, lines typed too slowly to be read, a voice blipping on
// spaces, two golfers with one voice, the jellyfish never gone, the Viper out before the heart bursts,
// a close-up placed for the narrowest screen, the ships still on screen as it fades, no surge on a
// launch, and the title playing the last level's music after a win.

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
    broke: 'the jellyfish still drawn once she has melted',
    guard: 'melts the jellyfish off the heart',
    edit: {
      path: 'src/render/finale.ts',
      find: '    if (melted < 1) {',
      replace: '    if (melted <= 1) {',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the Viper out of the heart before it has burst',
    guard: 'melts the jellyfish off the heart',
    edit: {
      path: 'src/render/finale.ts',
      find: '  if (t >= FINALE_BEATS.burst) {\n    if (t >= FINALE_BEATS.viperLit)',
      replace: '  if (t >= FINALE_BEATS.melted) {\n    if (t >= FINALE_BEATS.viperLit)',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the fighter’s close-up placed for the narrowest screen, stopping in mid-air on a wider one',
    guard: 'shows each cockpit close, with its hull running off its own edge of the screen on every screen',
    edit: {
      path: 'src/content/finale.ts',
      find: '  return saving ? alongSpan - inFrom : inFrom;',
      replace: '  return saving ? 213 - inFrom : inFrom;',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the two ships leaving too slowly to be gone when the picture goes',
    guard: 'has both ships leave the widest screen before the picture goes',
    edit: {
      path: 'src/render/finale.ts',
      find: '  const d = s - go;\n  return 0.5 * LAUNCH_ACCEL * d * d;',
      replace: '  const d = s - go;\n  return 0.1 * LAUNCH_ACCEL * d * d;',
    },
  },
  {
    decision: '0418',
    suite: 'tests/finale.test.ts',
    broke: 'the Viper’s launch heard with no surge seen',
    guard: 'plays every cue on a step that draws its twin',
    edit: {
      path: 'src/render/finale.ts',
      find: '  if (viperSurge > 0) putOut(surface, view, PORT_SPRITE.viperSurge, viperAlong, v.across, viperSurge);\n',
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
