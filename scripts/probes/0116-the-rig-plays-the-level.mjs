// The breaks behind docs/decisions/0116-the-rig-plays-the-level.md.
//
// ⚠️ THESE BREAK THE INSTRUMENT RATHER THAN THE GAME, which is a first for this repository. Nothing
// in `scripts/hear.mjs` reaches a player — and both times it drifted from the mixer, a verdict about
// the MUSIC was taken from it and very nearly acted on (0104's 4.5 dB, 0114's "massive volume
// difference"). A wrong instrument is worse than no instrument, because it still produces a number.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0116',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ 0114'S DRIFT, RE-CREATED EXACTLY. The rig held its own idea of a mixer quantity, so the file
      it wrote was not the sound the game makes — and the difference was reported as a defect in the
      music. `RAMP_SECONDS` is the one that decides the SHAPE of every section boundary, which is the
      channel the next six rounds of work are about.
    */
    broke: 'the rig given its own ramp constant, so the transitions it writes are not the ones the game plays',
    guard: 'THE ONE THAT DRIFTED TWICE: every mixer quantity the rig uses is imported, never restated',
    /*
      ⚠️ ANCHORED ON `busOf`, WHICH IS THE ONE LINE IN THIS FILE THAT CANNOT MOVE. The first version
      anchored on the import block and was stranded by 0117 adding one name to it — `anchorFailures`
      refused the whole run before a tree was copied, which is 0019 working, and it is also a lesson
      about where to put an anchor: not in a list that grows.
    */
    edit: {
      path: 'scripts/hear.mjs',
      find: 'const busOf = (sum) => saturate(sum * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN;',
      replace: 'const busOf = (sum) => saturate(sum * MUSIC_GAIN, MUSIC_DRIVE) * MASTER_GAIN;\nconst RAMP_SECONDS = 1.6;',
    },
  },
  {
    decision: '0116',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE MODE COLLAPSING BACK INTO `--music`. A rung order the rig keeps for itself puts every
      boundary where the rig thinks it goes, so the instrument cannot show the thing it was built to
      show — a section change landing where nobody is counting. This is the failure of the arc mode,
      which looked correct for six rounds.

      ⚠️ AND THE FIRST VERSION OF THIS PROBE POINTED AT A STRING IN `hear.mjs` AND REPORTED STILL
      GREEN, because the guard it aimed at only checked that a word appeared in the file.
    */
    broke: 'the rung read from a table the rig keeps, rather than asked of the game',
    guard: 'THE RUNG SEQUENCE IS THE GAME’S ANSWER, not a list the rig keeps',
    edit: {
      path: 'scripts/timeline.mjs',
      // ⚠️ THE ANCHOR MOVED WITH 0158's SIGNATURE — `bossAt` left the parameter list and the level's
      // own script joined it. What the probe breaks is unchanged: the rig answering from a table of
      // its own instead of asking the game.
      find: '  return musicLevelFor(camera, inFight, sections, health);',
      replace: "  return inFight ? 'boss' : second > 40 ? 'surge' : 'run';",
    },
  },
  {
    decision: '0116',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE LENGTH OF A LEVEL STOPPING TO MATTER, which is what an arc with a fixed slot per rung
      does. Seven levels of different lengths would all report the same boundaries, and the mode
      built to show where a boundary lands would be showing where the rig put it.
    */
    broke: 'the rig answering level one for every level, so all seven reach their rungs together',
    guard: 'and a level of a different length reaches its rungs at its OWN times',
    /*
      ⚠️ THE FIRST VERSION OF THIS PROBE BROKE `rungMarks`'s OWN `toBoss` AND REPORTED STILL GREEN.
      That local is only the loop's end; the rung comes from `rungAt`, which looks the level up again.
      A break has to be applied to the thing the guard actually reads — which is the half of 0019 that
      is about the BREAK rather than about the guard.

      ⚠️ AND 0158 MADE THE SECOND VERSION STOP REACHING ITS GUARD, WHICH `prove-guard` CAUGHT AS A
      WRONG TEST RATHER THAN AS A PASS. It fixed `bossAt` at 4270, because while the three distances
      were measured BACK FROM THE BOSS that was the whole of what made two levels differ. A script is
      level-local, so a wrong `bossAt` no longer moves a single section — it moves only where the
      fight starts. **What now has to be broken is the script**, and fixing both is what makes every
      level report level one's boundaries.
    */
    edit: {
      path: 'scripts/timeline.mjs',
      find: 'export function rungAt(kind, second, fightSeconds, sections = LEVELS[kind].sections) {\n  const { bossAt } = LEVELS[kind];',
      replace:
        'export function rungAt(kind, second, fightSeconds, sections = LEVELS[kind].sections) {\n' +
        '  sections = LEVELS.approach.sections;\n  const bossAt = 4270;',
    },
  },
  {
    decision: '0116',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE THEME DROPPED, WHICH IS 0107's OWN COMPLAINT REPRODUCED INSIDE THE INSTRUMENT. Without
      `mixOf`, every one of the seven levels renders as level one — so a rig built to answer *"the
      same music repeats level after level"* would write seven identical files and prove it.
    */
    broke: 'the theme multiplier dropped, so all seven levels render as level one',
    guard: 'THE PLACE IS IN IT: two themes do not render the same gains',
    edit: {
      path: 'scripts/timeline.mjs',
      find: '  return MUSIC_LADDER[rung][layer] * mixOf(theme, layer) * ceiling;',
      replace: '  return MUSIC_LADDER[rung][layer] * ceiling;',
    },
  },
  {
    decision: '0116',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE AURA READ AS A GAIN RATHER THAN A CEILING — 0091, and the exact falsehood `--solo`'s
      header says an instrument must never tell. A rig that sounded the dread at full from the start
      of a level would be reporting a boss the player cannot hear yet.
    */
    broke: 'the aura row read as a gain, so the dread sounds with no boss anywhere near',
    guard: 'and the aura arrives as a CEILING rather than a gain',
    edit: {
      path: 'scripts/timeline.mjs',
      find: '  const ceiling = AURA_LAYERS.includes(layer) ? aura : 1;',
      replace: '  const ceiling = 1;',
    },
  },
];
