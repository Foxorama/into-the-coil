// The breaks behind docs/decisions/0158-a-level-says-where-its-sections-open.md.
//
// ⚠️ THE THREE WAYS A PER-LEVEL SCRIPT COMES APART, and every one of them leaves seven levels that
// still play, still climb four rungs, and still pass every guard written before this decision:
//
//   1. THE SHAPE GOES BACK TO BEING SHARED. One level's script answering for all seven is exactly
//      what shipped before 0158 and exactly what the player named as a limiter. It is invisible on
//      level one — which is the level every report has been about — and wrong on the other six.
//   2. A SCRIPT IS AUTHORED OUT OF ORDER. `musicLevelFor` walks and breaks at the first entry the
//      camera has not reached, so a descending pair does not reorder a level's music: it DELETES a
//      section, silently, while every readout goes on drawing it.
//   3. A SHIPPED CALL SITE BUILDS ITS OWN. The whole of why threading a script is safe is that
//      `src/content/levels.ts` is the only place a level's shape is decided; a caller that passes a
//      literal makes it two places, and the second one wins wherever it is called from.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0158',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE REGRESSION TO WHAT SHIPPED BEFORE THIS DECISION, and the reason it needs a guard at all.
      Every level walks level one's script, so all seven open their sections at the same distances —
      which is *"the exact same timing for each"*, the thing the player asked to be rid of. Level one
      is unaffected, so a session that checked its work on The Approach would see nothing.
    */
    broke: 'every level walked with level one’s script, so the shape is shared again',
    guard: '0158 — and EVERY level says for itself where its sections open, in SECONDS',
    edit: {
      path: 'src/app/music.ts',
      find: '  let section: MusicLevel = \'run\';\n  for (let i = 0; i < sections.length; i++) {',
      replace:
        "  let section: MusicLevel = 'run';\n" +
        '  sections = LEVELS.approach.sections;\n' +
        '  for (let i = 0; i < sections.length; i++) {',
    },
  },
  {
    decision: '0158',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A SECTION THAT NEVER HAPPENS, WRITTEN AS CONTENT RATHER THAN REACHED BY A DRAG. 0138 clamped
      the DASHBOARD against this and nothing stopped a hand typing it into `src/content/levels.ts` —
      which is the half 0158 adds, because a script is authored now and not only dragged. `surge`
      placed before `push` means `push` is walked over and never returned, and the level plays three
      sections while its row names four.
    */
    broke: 'a level’s script authored out of order, so one of its sections never happens',
    guard: '0158 — and a script is ascending, opens at zero, and never names the fight',
    edit: {
      path: 'src/content/levels.ts',
      // `descent`'s numbers are its own — levels one and three ship identical scripts, so an anchor
      // on either of those appears twice and `planEdit` refuses it.
      find: "      { at: 1299, section: 'push' },",
      replace: "      { at: 2999, section: 'push' },",
    },
  },
  {
    decision: '0158',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE SHELL DECIDING A LEVEL'S SHAPE FOR ITSELF, which is `gainOf`'s own failure (0126) on a
      different quantity. It looks like a simplification — the boundaries are right there, why reach
      through the row — and it makes `src/content/levels.ts` stop being the whole story of what a
      level does. 0138 held this by COUNTING arguments, which cannot work once every caller has to
      pass one; the scan reads the expression instead, and this is what proves it still bites.
    */
    broke: 'the shell passing section distances of its own, so a level’s shape is decided in two places',
    guard: 'EVERY CALL UNDER src/ PASSES THE LEVEL’S OWN SCRIPT — the shape of a level is decided in one place',
    edit: {
      path: 'src/app/mount.ts',
      find: '            world.level.sections,',
      replace: "            [{ at: 0, section: 'run' }, { at: 1249, section: 'push' }],",
    },
  },
];
