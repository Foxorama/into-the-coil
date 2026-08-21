// The breaks behind docs/decisions/0189-a-place-is-what-it-does-not-play.md.
//
// ⚠️ THE DECISION'S HEADLINE CLAIM HAS NO BREAK, AND 0019 ASKS THAT BE SAID OUT LOUD. *A place is
// what it does not play* is an authoring change — six layers closed, two opened — and
// docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md is explicit that musical shape must not
// be asserted on. Re-opening `chords` in Saurian Belt would go green, correctly: it is the shape the
// place shipped with yesterday. What IS guarded is everything the closure broke on its way past, and
// that is what these two are.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0189',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE AUDITION HANDING BACK SILENCE FOR A LAYER THE PLACE CLOSES. `loudestGain` walks this
      place's own ladder, and Saurian Belt's is zero for `chords` at all seven rungs — so the
      one-click audition docs/decisions/0130-a-layer-can-be-heard-on-its-own.md exists to provide is
      silent for exactly the six layers a session working on that place needs to hear. It is
      docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md's own defect one table later:
      *"trim × 0 is 0, so the layers the ladder has closed were unreachable, and those are exactly
      the ones worth auditioning."*

      ⚠️ THE FALLBACK IS THE WHOLE FIX, so taking it away is the whole break. Nothing else in the
      repository would notice: the six layers still bake, still hold their voices, and still read
      correctly everywhere the GAME asks about them.
    */
    broke: 'the audition left at zero for a layer its place closes at every rung, so the desk cannot reach it',
    guard: 'and NO LAYER IS UNREACHABLE — all twenty-three can be got at, in every place',
    edit: {
      path: 'rig/transport.ts',
      find: '  if (most > 0) return most;',
      replace: '  return most;',
    },
  },
  {
    decision: '0189',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE HAND DRUM'S ENVELOPE PUT BACK, AND IT IS THE LINE THAT MOVES THE NUMBER. The first
      version of this probe re-placed the drum ON THE BEAT as well — the defect the decision's own
      comment describes — and the suite STAYED GREEN, which is how the split below came to be
      measured at all. Re-placing it is worth 0.02 of the 0.41 points; this envelope is worth 0.011
      on its own and is what carries `bossPeak` past the guard.

      ⚠️ SO THE PROBE POINTS AT THE FIX RATHER THAN AT THE STORY, which is the whole of
      docs/decisions/0019-a-probe-must-be-seen-to-apply.md. A break aimed at the sentence a decision
      is proudest of, that reddens nothing, is worse than no probe: it reports that the guard is
      watching something it is not.

      ⚠️ AND IT IS THE UNIT A LISTENER IS IN — docs/decisions/0027-measure-the-picture-not-the-model.md.
      The guard reads the share of SAMPLES pushed past full scale, which is heard as the drums
      flattening, rather than a model quantity defined in terms of the constant it guards.
    */
    broke: "the hand drum's attack and saturation put back, so its transients reach the shaper's clamp",
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'src/content/saurian.ts',
      find: "note: { wave: 'sine', from: 188, to: 106, seconds: 0.22, gain: 0.34, attack: 0.004, curve: 4.2, drive: 0.42 },",
      replace: "note: { wave: 'sine', from: 188, to: 106, seconds: 0.22, gain: 0.38, attack: 0.001, curve: 4.2, drive: 0.2 },",
    },
  },
  {
    decision: '0189',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE BOSS BED LIFTED ABOVE `surge`, WHICH IS THE CASCADE THIS DECISION FELL INTO AND CLIMBED
      BACK OUT OF. docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md's floor is
      RELATIVE: raise the drums at `boss` and `dread`, `frenzy`, `wraith`, `stomp` and `sub` all
      have to be raised to go on performing their roles over them — and the sum of all of it is what
      the bus sees. The first version of these rows read `sub: 2.3, dread: 4.2` for exactly that
      reason and drove the clamp on 0.31% of samples.

      ⚠️ IT IS A DIFFERENT CLAIM FROM THE ENVELOPE ABOVE, AND BOTH ARE NEEDED. One says a transient
      may be too sharp for the level it sits at; this says a LEVEL may be too high for the sum it
      joins, and that a role floor will happily propagate it. Neither break reddens the other's.

      ⚠️ THE FIX IS THAT `boss` CARRIES `surge`'s BED RATHER THAN LIFTING IT. A fight that adds the
      lasers and the tritone without turning the drums up is what
      docs/decisions/0114-the-fight-is-a-different-piece.md asks for anyway: *"a different piece
      requires the old one to stop"*, not the old one to get louder.
    */
    broke: 'the boss bed lifted over `surge`, so the role floor drags every layer above it up with it',
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'src/content/themes.ts',
      find: '      bossPeak: { drone: 0, ride: 0, sub: 1.6, engine: 1.68, perc: 2.21, drive: 1.25, ownB: 1.62, toll: 1.35, dread: 1.85, frenzy: 1.2, wraith: 1.3, stomp: 1 },',
      replace: '      bossPeak: { drone: 0, ride: 0, sub: 2.3, engine: 1.72, perc: 2.26, drive: 1.62, ownB: 1.76, toll: 1.5, dread: 4.2, frenzy: 1.6, wraith: 1.7, stomp: 2 },',
    },
  },
];
