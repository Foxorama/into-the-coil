// The fish throws a breaker — docs/decisions/0315-the-fish-throws-a-breaker.md
//
// Every guard 0315 adds, broken on purpose. `node scripts/prove-guard.mjs 0315`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0315',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE WAVE THROWN FROM THE MUZZLE, which is every other attack in the table and is the whole of
      what this one is not. The shots still fly, still bow and still sound the same; what is gone is the
      only property that makes the player answer it along the lane instead of across it.
    */
    broke: 'the wave thrown from the hull rather than up off the edge, so it is a fan again',
    guard: 'THE ASKED-FOR ONE: the wave comes up off the EDGE',
    edit: {
      path: 'src/app/boss.ts',
      find: '        reset(shot, boss.along - attack.span / 2 + attack.span * t, edge, bullet, kind);',
      replace: '        reset(shot, boss.along - attack.span / 2 + attack.span * t, muzzleAcross, bullet, kind);',
    },
  },
  {
    decision: '0315',
    suite: 'tests/volans.test.ts',
    // Every shot at one rate: a rank rising together, which is a wall laid on its side and not a wave.
    broke: 'the wave rising flat, so it is a rank and not a breaker',
    guard: 'THE ASKED-FOR ONE: the wave comes up off the EDGE',
    edit: {
      path: 'src/content/bosses.ts',
      find: "attack: { kind: 'breaker', span: 96, rise: 1.5, ends: 0.66 }",
      replace: "attack: { kind: 'breaker', span: 96, rise: 1.5, ends: 1 }",
    },
  },
  {
    decision: '0315',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE BOW INVERTED — the shoulders outrunning the crest. It bows, so *is it flat* stays green;
      what it draws is a trough opening in the middle of the wave, which is the opposite picture and
      the opposite dodge.
    */
    broke: 'the bow inverted, so the wave sags in the middle instead of cresting',
    guard: 'THE ASKED-FOR ONE: the wave comes up off the EDGE',
    edit: {
      path: 'src/app/boss.ts',
      find: '        const crest = 1 - Math.abs(t - 0.5) * 2;',
      replace: '        const crest = Math.abs(t - 0.5) * 2;',
    },
  },
  {
    decision: '0315',
    suite: 'tests/volans.test.ts',
    // The edge broken and nothing drawn there: bullets from nowhere, which is 0036's own subject.
    broke: 'the spray at the edge dropped, so the wave arrives out of an empty line',
    guard: 'the edge it came up through is drawn',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (calling.kind === 'breaker' && w.enemyShots.size > beforeVolley) burst(w, boss.along, ACROSS_SPAN, BURST.breach);\n",
      replace: '',
    },
  },
  {
    decision: '0315',
    suite: 'tests/volans.test.ts',
    // And the edge breaking sounding like a mouthful of anything: the crash thirteen bosses share.
    broke: 'the breaker back on the shared crash, so the edge breaking has no sound of its own',
    guard: 'the edge it came up through is drawn',
    edit: {
      path: 'src/content/bosses.ts',
      find: "rise: 1.5, ends: 0.66 }, cue: 'bossBreach'",
      replace: "rise: 1.5, ends: 0.66 }, cue: 'bossShot'",
    },
  },
];
