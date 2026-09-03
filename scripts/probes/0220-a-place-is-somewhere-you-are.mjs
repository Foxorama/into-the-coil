// The breaks behind docs/decisions/0220-a-place-is-somewhere-you-are.md.
//
// ⚠️ FIVE PLACES REDRAWN AND ONLY NINE THINGS ABOUT THEM ARE TRUE OR FALSE. The report was almost
// entirely about character — *"a lot more detail"*, *"a lot more character and depth"*, *"a beating
// black heart"* — and 0192 says a guard holds an invariant, so most of that list is held by
// `scripts/shot-place.mjs` and by eyes. What is below is the part where there is exactly one right
// answer: a horizon off the screen is not a planet, a corridor whose walls cross is not a corridor, a
// heart that does not change size is not beating, and a level placing a landmark into a place that
// draws none is an empty blit at exactly the right coordinates for a whole level.
//
// ⚠️ THREE OF THE NINE ARE THE SAME TRAP TWICE OVER — 0027. The weather tile is twice the lane and
// blitted centred, so tile y 0.25 to 0.75 is everything the player can see. The Approach's horizon
// shipped at 0.86 and every guard passed; the Pillars' far columns were given feet at 0.97 and were
// drawn entirely below the frame. Both were found by looking at a picture, and neither could have
// been found any other way until now.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    ⚠️ TWO PROBES USED TO STAND HERE AND 0221 DELETED WHAT THEY BROKE. They aimed at Saurian Belt's
    ridges inside `STRUCTURE_OF` — *a skyline authored below the lane* and *the far ridge lit as
    brightly as the near one* — and that place's ground is `GROUND_OF` now, drawn opaque in its own
    layer, because painting it into the weather tile put both star fields in front of it.

    ⚠️ THE GUARDS THEY BROKE WENT WITH IT, AND THAT IS THE HONEST OUTCOME RATHER THAN A LOSS. A probe
    whose anchor is gone can be re-pointed at whatever looks similar — which is exactly how a probe
    survives `tests/prove-guard.test.ts` and stops proving anything (0220's own 0211 re-anchor is the
    worked example). The claims themselves are re-made against the new layer in
    `scripts/probes/0221-a-planet-is-not-a-space.mjs`, where *on the lane* is now about a mass rather
    than about a crest line. `docs/decisions/0192-a-guard-holds-an-invariant.md`: **demoting a guard
    takes one edit and a reason.**
  */
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE CORRIDOR TURNED INSIDE OUT. Both walls come off one `widthAt`, so a swing wider than the
      gap it modulates puts the upper wall below the lower one — the channel closes and reopens with
      its sides swapped. It draws as a bow tie, and the number that does it looks like a tuning knob.
    */
    broke: 'the channel’s breathing widened past its own gap, so the two walls cross',
    guard: 'the corridor never closes',
    edit: {
      path: 'src/render/bake.ts',
      find: '      widthAt: (t: number): number => gap * (1 + 0.22 * Math.sin(Math.PI * 2 * t + phase)),',
      replace: '      widthAt: (t: number): number => gap * (1 + 1.6 * Math.sin(Math.PI * 2 * t + phase)),',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE FORK REMOVED, LEAVING A TUNNEL. A single twisting channel satisfies *a path the player is
      flying through* and says nothing at all about *branching*, which was the other word in the
      report — and a corridor with nothing coming off it looks entirely finished.
    */
    broke: 'the island taken out, so the path stops splitting and is only a tunnel',
    guard: 'it BRANCHES',
    edit: {
      path: 'src/render/bake.ts',
      find:
        '    out.push({ points: island, width: WALL * size * 0.55, alpha: 0.55, crosses: false, taper: true, lit: false });\n' +
        '    out.push(rim(island, lift > 0 ? -0.55 : 0.55, 0.42, false));',
      replace: '',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE BEAT STOPPED WITHOUT ANYTHING LOOKING BROKEN. Nothing else in this repository asks a baked
      sprite to move, so a landmark that has stopped beating draws perfectly — right sprite, right
      place, right size — for ever, and the only report available is somebody remembering that it used
      to move.
    */
    broke: 'the swell taken to nothing, so the heart draws perfectly and never beats',
    guard: 'The Black Heart’s landmark changes size',
    edit: {
      path: 'src/render/scene.ts',
      find: 'const BEAT_SWELL = 0.055;',
      replace: 'const BEAT_SWELL = 0;',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    // And the same silence from the content side: the renderer is fine and the level asks for nothing.
    broke: 'the level’s own beat set to none, so the renderer works and the heart is still',
    guard: 'The Black Heart’s landmark changes size',
    edit: {
      path: 'src/content/levels.ts',
      find: '    landmarks: [{ at: 2360, lane: 46, depth: 0.07, beat: 96 }],',
      replace: '    landmarks: [{ at: 2360, lane: 46, depth: 0.07, beat: 0 }],',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE SECOND THUMP DROPPED, WHICH THE SIZE TEST CANNOT SEE. One rise per cycle passes *the
      landmark changes size* with room to spare and reads as a pulsing light or a slow breath.
      *Lub-dub* is the entire reason a person recognises a heartbeat, and it is a claim about the
      SHAPE of the cycle rather than about its range — the distinction 0219 spent four passes learning
      in the music.
    */
    broke: 'the second thump dropped, so the cycle is a pulse rather than a heartbeat',
    guard: 'TWO thumps and a rest',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const dub = Math.max(0, 1 - Math.abs(phase - 0.27) / 0.06);',
      replace: '  const dub = 0;',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ A CYCLE THAT DOES NOT ARRIVE WHERE IT LEFT — 0207's rule on a different axis. Centring the
      first thump on phase zero is the obvious authoring choice and it puts the peak against the wrap,
      so the object jumps a full swell between two adjacent frames, once a beat, for ever.
    */
    broke: 'the first thump centred on the wrap, so the size steps once every cycle',
    guard: 'the beat does not step where it wraps',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const lub = Math.max(0, 1 - Math.abs(phase - 0.07) / 0.07);',
      replace: '  const lub = Math.max(0, 1 - Math.abs(phase) / 0.07);',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE HOLE THE TABLE OPENED, AND THE GATE IT REPLACED COULD NOT HAVE. `if (theme !== 'nebula')
      return` drew nothing for six places in one line. A `Record` with a `null` in it can disagree with
      the level scripts, and when it does the painter blits an empty sprite at exactly the right
      position and the right size on every frame of that level.
    */
    broke: 'the place that has a landmark set to draw none, while its level still places one',
    guard: 'no level places a landmark in a place that draws none',
    edit: {
      path: 'src/render/bake.ts',
      find: '  nebula: (ctx, ink, space, size) => drawPillars(ctx, ink, space, size),',
      replace: '  nebula: null,',
    },
  },
  {
    decision: '0220',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE PER-SEGMENT STROKE PUT BACK, WHICH IS HOW IT WAS FROM 0211 UNTIL THE BENCH SHOWED IT. A
      round `lineCap` covers every join twice, so a mark composites its own alpha against itself once
      per point. On a hairline rim that is invisible; on a wall face at a tenth of the gas it is a
      string of beads down the middle of the wall, and no number in the file reports it.
    */
    broke: 'the taper test inverted, so a wide mark is a bead per join again',
    guard: 'a wide mark is not drawn as a bead per join',
    edit: {
      path: 'src/render/bake.ts',
      find: '      if (!mark.taper) {',
      replace: '      if (mark.taper) {',
    },
  },
  {
    decision: '0220',
    suite: 'tests/prove-guard.test.ts',
    /*
      ⚠️ THE HARNESS'S OWN VERDICT, AND IT IS IN THIS DECISION BECAUSE IT IS WHAT STOPPED IT SHIPPING.
      `prove` fingerprinted `trees[0]` and judged all six workers against it. Six copies of one tree
      ARE one tree if they are taken at one instant, and they are taken one after another — so
      anything that moves in the source between the first and the last is drift in five trees that no
      probe put there.

      ⚠️ AND THIS REPOSITORY GUARANTEES SOMETHING MOVES. `.claude/typecheck.log` is appended to by its
      own PostToolUse hook on every edit, and `.claude/skills/ship/SKILL.md` says to start `prove` *"at
      commit time in the background"*. Observed on this branch: 774 probes red, five workers reported
      as not restored, exit code 1, over a gitignored log. **Nothing was wrong with the tree and
      nothing was wrong with a probe.**
    */
    broke: 'the fingerprint taken once and reused, so five workers are judged against a sixth’s copy',
    guard: 'each tree is judged against ITS OWN copy',
    edit: {
      path: 'scripts/prove-guard.mjs',
      find: '  return paths.map((path) => ({ path, pristine: take(path) }));',
      replace: '  const shared = take(paths[0]);\n  return paths.map((path) => ({ path, pristine: shared }));',
    },
  },
];
