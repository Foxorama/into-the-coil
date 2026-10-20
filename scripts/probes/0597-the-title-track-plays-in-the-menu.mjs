// The breaks behind docs/decisions/0597-the-title-track-plays-in-the-menu.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'every pass of the score opened from silence',
    guard: 'reads the score as the album does',
    edit: {
      path: 'src/content/title-track.ts',
      // Re-anchored by 0645, where the score became one of two.
      find: '  let was = again ? score[score.length - 1]!.parts[name] ?? 0 : 0;',
      replace: '  let was = 0;',
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    // The scale forgets the bus gain it is measured through: every part six and three-quarter decibels quiet.
    broke: 'the title parts baked to their level off the bus',
    guard: 'bakes each part to its own level, in the decibels a listener hears',
    edit: {
      path: 'src/app/music.ts',
      find: '    const scale = 10 ** ((part.db - rmsDbOf(buffer)) / 20) / MUSIC_GAIN;',
      replace: '    const scale = 10 ** ((part.db - rmsDbOf(buffer)) / 20);',
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'a pass left the one before it playing',
    guard: 'takes over from the run’s music at a bar, plays the score round, and hands back at a bar letting the title go',
    edit: {
      path: 'src/app/music.ts',
      find: '    for (let i = 0; i < titleSources.length; i++) titleSources[i]!.stop(when);\n',
      replace: '',
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'a run kept the title track',
    guard: 'takes over from the run’s music at a bar, plays the score round, and hands back at a bar letting the title go',
    edit: {
      path: 'src/app/music.ts',
      find: '      if (!wanted) {\n        titleBuffers = null;\n',
      replace: '      if (!wanted) {\n',
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'the title handed back off the bar',
    guard: 'takes over from the run’s music at a bar, plays the score round, and hands back at a bar letting the title go',
    edit: {
      path: 'src/app/music.ts',
      find: '        const at = placeArrivesAt(anchorAudio, ctx.currentTime, SCHEDULE_AHEAD);\n        const until = at + TITLE_HANDOVER_SECONDS;',
      replace: '        const at = ctx.currentTime + 0.01;\n        const until = at + TITLE_HANDOVER_SECONDS;',
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'the title played on with the sound off',
    guard: 'is silenced with the music, and starts again when the sound comes back on',
    edit: { path: 'src/app/music.ts', find: '      stopTitle(off);\n', replace: '' },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'the title played in a run',
    guard: 'is wanted on every screen that is not part of a run, and on none that is, nor in the music room, nor with the sound off',
    edit: {
      path: 'src/app/music.ts',
      find: "  return !SCREENS[screen].inRun && audition === null && sound === 'on';",
      replace: "  return audition === null && sound === 'on';",
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    broke: 'the title held with the sound off',
    guard: 'is wanted on every screen that is not part of a run, and on none that is, nor in the music room, nor with the sound off',
    edit: {
      path: 'src/app/music.ts',
      find: "  return !SCREENS[screen].inRun && audition === null && sound === 'on';",
      replace: '  return !SCREENS[screen].inRun && audition === null;',
    },
  },
  {
    decision: '0597',
    suite: 'tests/title-menu.test.ts',
    // The lead's sixteen bars as a hundred and sixty: the menu's title past what a place may hold beside it.
    broke: 'a title too long to hold beside a place',
    guard: 'BUDGET: is held only off a run, so what a run holds never has it beside it',
    edit: {
      path: 'src/content/title-track.ts',
      find: '    bars: 16,\n    air: 0.3,\n    pan: -0.1,',
      replace: '    bars: 160,\n    air: 0.3,\n    pan: -0.1,',
    },
  },
  {
    decision: '0597',
    suite: 'tests/sound.browser.test.ts',
    broke: 'the menu never asked for its title',
    guard: 'and choosing Off makes it silent without making it any less unlocked',
    edit: { path: 'src/app/mount.ts', find: '    keepTitle(music);\n', replace: '' },
  },
];
