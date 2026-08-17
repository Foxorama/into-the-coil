// The breaks behind docs/decisions/0098-a-wave-plays-a-figure.md.
//
// ⚠️ THIS DECISION IS A SECOND PASS OVER A DEFECT 0096 ALREADY ANSWERED, so every probe here has to
// fail a guard that scripts/probes/0096-enemies-on-the-grid.mjs does not. 0096 put every cadence and
// every first shot on the sixteenth grid, and its guards measure exactly that — all of them are
// perfectly green over the build the player called *"the enemies all fire at exactly the same time."*
// What is broken below is the SPREAD and the three bullets: two things 0096 had no opinion about,
// because under 0096 every member of a formation was handed the same phase by construction.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0098',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE SHIPPED BEHAVIOUR, PUT BACK — and it is one argument. Dropping the share leaves 0096
      exactly as it was: every cadence on the grid, every first shot aligned, and every member of a
      formation aligned to the SAME sixteenth, because `w.steps` and `row.fireEvery` do not vary down
      that loop. This is the build the report is about and every guard 0096 wrote is green over it.
    */
    broke: 'the share dropped from the spawn alignment, so a formation reloads in unison again',
    guard: '0098 — THE REPORTED ONE: a formation opens fire as a figure rather than as one volley',
    edit: {
      path: 'src/app/frame.ts',
      find: '    e.fireIn = nextOnGrid(w.steps, fireGapFor(row.fireEvery, w.difficulty), (i + index) / wave.count);',
      replace: '    e.fireIn = nextOnGrid(w.steps, fireGapFor(row.fireEvery, w.difficulty));',
    },
  },
  {
    decision: '0098',
    suite: 'tests/difficulty.test.ts',
    /*
      ⚠️ THE SLOTS COUNTED OFF THE WAVE INSTEAD OF OFF THE CADENCE, which is the tidy-up a hand would
      make: the share is already `member / count`, so multiplying by the count and taking whole grid
      units reads like the same thing said twice. It is not. A wave of six lancers has thirteen
      sixteenths available and would use six of them either way; a wave of TEN turrets has eight, and
      counting off the wave puts two of them on the same slot silently — while the version below
      pushes a body a whole cadence past its own period and out of the pattern altogether.
    */
    broke: 'the slots counted off the wave rather than off the body’s own cadence',
    guard: '0098 — and a SHARE only ever delays a body, so nothing becomes dangerous sooner than it was',
    edit: {
      path: 'src/content/cadence.ts',
      find: '  const slots = Math.max(1, Math.round(gap / FIRE_GRID));',
      replace: '  const slots = Math.max(1, Math.round(gap / FIRE_GRID)) * 2;',
    },
  },
  {
    decision: '0098',
    suite: 'tests/difficulty.test.ts',
    /*
      ⚠️ THE SPREAD RUN THE OTHER WAY, which is the version that looks kinder and is not. Subtracting
      slots instead of adding them keeps every body inside one cadence of the spawn — it even
      satisfies 0096's original sentence — and it makes a wave open fire up to a whole cadence SOONER
      than it used to, which is the balance change 0096 refused to make in the opposite direction.
    */
    broke: 'the spread run backwards, so a formation opens fire sooner than it ever did',
    guard: '0098 — and a SHARE only ever delays a body, so nothing becomes dangerous sooner than it was',
    edit: {
      path: 'src/content/cadence.ts',
      find: '  return base + Math.floor(wrapped * slots) * FIRE_GRID;',
      replace: '  return base - Math.floor(wrapped * slots) * FIRE_GRID;',
    },
  },
  {
    decision: '0098',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE REPORTED PICTURE, PUT BACK: *"all the enemy bullets are exactly the same."* Every
      shooting enemy naming one row is how the game shipped for its whole life, and nothing in the
      repository noticed — `no two shots in the game share a silhouette` is about the TABLE, and the
      table was always fine. What was wrong is which rows the content actually sends.

      ⚠️ IT REPORTED STILL GREEN ON ITS FIRST RUN AND THE GUARD IS WHAT MOVED. The assertion counted
      the enemies and the bosses together, and they live in different files — so putting the lancer
      back on the spit still left three kinds in circulation. A guard over a TOTAL cannot be reached
      by a one-file regression, which is the shape of every regression there has ever been here.
    */
    broke: 'the lancer put back on the spit, so two of the three shooting kinds send one bullet',
    guard: '0098 — THE REPORTED ONE: what shoots back is not all one bullet',
    edit: {
      path: 'src/content/enemies.ts',
      /*
        ⚠️ **The anchor carries the next line, and 0110 is why.** `shot: 'lance'` was unique until the
        sower joined the table; an anchor that matches twice is one the harness refuses, which is the
        same failure as one that matches nothing. The lancer's own comment is what disambiguates it.
      */
      find: "    shot: 'lance',\n    /*\n      ⚠️ **IT NOW COMES TO YOU,",
      replace: "    shot: 'spit',\n    /*\n      ⚠️ **IT NOW COMES TO YOU,",
    },
  },
  {
    decision: '0098',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE PAIRING INVERTED, and it is the break that turns a legibility change into a difficulty
      one with every other guard green. The hurtboxes are identical, so nothing in the suite can see
      a bullet getting harder to dodge — what says this is fair is that the QUICK shot is the SMALL
      one. Make the fast one fat and the player has less time and less lane, and the tables still
      agree with each other perfectly.
    */
    broke: 'the fast bullet drawn as the fat one, so the variety is a difficulty change',
    guard: '0098 — THE REPORTED ONE: what shoots back is not all one bullet',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  lance: 1.9,',
      replace: '  lance: 4.1,',
    },
  },
];
