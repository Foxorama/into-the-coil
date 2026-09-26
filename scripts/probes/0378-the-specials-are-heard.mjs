// The breaks behind docs/decisions/0378-the-specials-are-heard.md.
//
// ⚠️ The first five put each special back on the sound it borrowed. The first of them is not
// hypothetical: the edit that moved the surges off the shield's cue was refused by the editor and
// went unnoticed, and the guard below it is what found the surges still sounding like a shield.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    broke: 'a surge back on the shield’s cue',
    guard: 'the press plays its row’s cue on the step it is pressed',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.onCue(row.cue, w.ship.across);',
      replace: "    w.onCue('shield', w.ship.across);",
    },
  },
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    broke: 'the whirlpool back on the blades’ throw',
    guard: 'the press plays its row’s cue on the step it is pressed',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.onCue(row.cue, w.whirlAcross);',
      replace: "    w.onCue('throw', w.whirlAcross);",
    },
  },
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    broke: 'every thrown special back on the bomb’s launch',
    guard: 'the press plays its row’s cue on the step it is pressed',
    edit: {
      path: 'src/app/frame.ts',
      find: "hollow.\n  w.onCue(row.cue, w.ship.across);",
      replace: "hollow.\n  w.onCue('bomb', w.ship.across);",
    },
  },
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    broke: 'the storm going off on the arc’s zap',
    guard: 'what it goes off as when it does',
    edit: {
      path: 'src/app/frame.ts',
      find: "It borrowed the arc's zap.\n  if (sound !== null) w.onCue(sound, across);",
      replace: "It borrowed the arc's zap.\n  w.onCue('zap', across);",
    },
  },
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    broke: 'the rift opening on the bomb’s blast',
    guard: 'what it goes off as when it does',
    edit: {
      path: 'src/app/frame.ts',
      find: "It borrowed the bomb's blast.\n  if (sound !== null) w.onCue(sound, across);",
      replace: "It borrowed the bomb's blast.\n  w.onCue('blast', across);",
    },
  },
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    // The bomb's own blast, dropped: a thrown special that goes off in silence.
    broke: 'a bomb that goes off without a sound',
    guard: 'what it goes off as when it does',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (row.lands !== null) w.onCue(row.lands, bomb.across);',
      replace: '',
    },
  },
  {
    decision: '0378',
    suite: 'tests/bombs.test.ts',
    broke: 'the storm’s row naming the bomb’s launch',
    guard: 'no two specials share a press',
    edit: { path: 'src/content/specials.ts', find: "    cue: 'stormThrow',", replace: "    cue: 'bomb'," },
  },
  {
    decision: '0378',
    suite: 'tests/sound.test.ts',
    // The rig as it was: every cue laid by its middle through the mono law.
    broke: 'a wide cue laid by its middle',
    guard: 'a cue is laid in its own width',
    edit: { path: 'src/app/sound.ts', find: '  const wide = widthOf(cue);', replace: '  const wide = null;' },
  },
  {
    decision: '0378',
    suite: 'tests/music.test.ts',
    broke: 'the stereo law splitting the middle like the mono one',
    guard: 'a STEREO input is leaned, not split',
    edit: {
      path: 'src/app/music.ts',
      find: '    ? { leftToLeft: 1, rightToLeft: toLeft, leftToRight: 0, rightToRight: toRight }',
      replace: '    ? { leftToLeft: Math.SQRT1_2, rightToLeft: toLeft, leftToRight: 0, rightToRight: toRight }',
    },
  },
  {
    decision: '0378',
    suite: 'tests/music.test.ts',
    // The catalogue as it was: one channel, so a cue that sweeps is judged standing still.
    broke: 'the cue catalogue written in mono',
    guard: 'every rig render that carries the music is written in stereo',
    edit: {
      path: 'scripts/hear.mjs',
      find: 'writeFileSync(out, wavOf(joined, SAMPLE_RATE, 2));',
      replace: 'writeFileSync(out, wavOf(joined, SAMPLE_RATE));',
    },
  },
  // ── The hush — the void's silence, after the first set of sounds was refused. ──
  {
    decision: '0378',
    suite: 'tests/sound.test.ts',
    broke: 'the speaker restarting the hush on every step',
    guard: 'passes the hush on when it changes, and only then',
    edit: { path: 'src/app/sound.ts', find: '      if (next === hushed) return;', replace: '' },
  },
  {
    decision: '0378',
    suite: 'tests/void.test.ts',
    broke: 'the hush lifting when the ball goes off and the rift is still open',
    guard: 'hushed from the moment the void is fired until its rift has closed',
    edit: {
      path: 'src/app/frame.ts',
      find: "    if (body.kind === RIFT_KIND && SPECIALS[SPECIAL_KINDS[body.face] ?? 'bomb'].hushes) return true;",
      replace: '',
    },
  },
  {
    decision: '0378',
    suite: 'tests/sound.test.ts',
    broke: 'the whumm hushed with everything else',
    guard: 'exactly the cues of a special that hushes go round the hush',
    edit: { path: 'src/content/cues.ts', find: '    air: 0.2,\n    throughHush: true,', replace: '    air: 0.2,' },
  },
  {
    decision: '0378',
    suite: 'tests/sound.browser.test.ts',
    broke: 'the cue field wired past the hush',
    guard: 'THE HUSH: the field, the room and the music reach the master through one gain',
    edit: { path: 'src/app/sound.ts', find: '          place.connect(hushGain);', replace: '          place.connect(master);' },
  },
  {
    decision: '0378',
    suite: 'tests/sound.browser.test.ts',
    broke: 'the music wired past the hush',
    guard: 'THE HUSH: the field, the room and the music reach the master through one gain',
    edit: {
      path: 'src/app/sound.ts',
      find: '        music = makeMusicOut(ctx, hushGain, wholeLoops(), SAMPLE_RATE);',
      replace: '        music = makeMusicOut(ctx, master, wholeLoops(), SAMPLE_RATE);',
    },
  },
  {
    decision: '0378',
    suite: 'tests/sound.browser.test.ts',
    broke: 'the room ringing on through the silence',
    guard: 'THE HUSH: the field, the room and the music reach the master through one gain',
    edit: { path: 'src/app/sound.ts', find: '        wet.connect(hushGain);', replace: '        wet.connect(master);' },
  },
];
