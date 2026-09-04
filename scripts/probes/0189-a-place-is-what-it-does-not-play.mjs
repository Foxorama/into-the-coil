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
  /*
    ── THE ENVELOPE BREAK IS RETIRED, AND WHAT RETIRED IT IS A LATER DECISION'S FIX ───────────────

    ⚠️ docs/decisions/0191-a-place-sits-somewhere.md gave this place a `trim` — the whole of Saurian
    Belt 1.4 dB down — so the bus has headroom the envelope used to be buying. Putting the hand drum's
    1 ms attack and its old saturation back now reads **under** the clip guard rather than over it,
    and `npm run prove` reported STILL GREEN on the run after 0191 landed.

    ⚠️ THE MATERIAL CHANGE STANDS AND IS NOT REVERTED WITH THE PROBE. A softer attack on a hand drum
    under two kicks is right whether or not a guard is watching; what is gone is the claim that this
    line is what keeps the bus inside full scale, because it is not any more.

    ⚠️ AND IT IS THE THIRD WAY A PROBE HAS ROTTED IN TWO DAYS, WHICH IS WORTH THE COUNT. 0188's went
    stale because a later decision filled a second slot; 0186's because a later decision closed the
    layer it was about; this one because a later decision made its quantity comfortable. **None of
    the three moved the code the probe points at.** docs/decisions/0019-a-probe-must-be-seen-to-apply.md
    catches all three and only on the full run.

    ⚠️ WHAT 0189 STILL OWNS IS THE CASCADE BREAK BELOW, which reddens the same guard by the same
    arithmetic and is the half that was always the bigger of the two.
  */

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
    /*
      ⚠️ RE-AIMED BY 0226. With every rung held to its `run`, a lifted boss bed no longer reaches the
      clamp — the loudest sample anywhere is 0.969 of full scale — but it is a ladder row edited
      under a solved hold, and that is what the hold guard is for: it went red on this break before
      the clamp guard was even reached, on exactly the rung this edit lifts.
    */
    guard: 'every rung of a place holds its run loudness',
    edit: {
      path: 'src/content/themes.ts',
      // Re-anchored by 0191, which restored the player's driven state to every row.
      /*
        ⚠️ RE-ANCHORED BY 0191, AND THE FIRST ATTEMPT AT IT POINTED AT THE WRONG PLACE. A regex for
        the first `bossPeak:` row in the file matches EMBER NEBULA's, so the break rewrote a level
        this decision is not about — and it went red anyway, on the right guard, for a reason that
        proves nothing. That is the failure this decision's own text describes about 0089 firing on
        the wrong layer, committed while repairing an anchor.
      */
      find: 'bossPeak: { drone: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.6, engine: 1.68, perc: 2.21, drive: 1.25, toll: 1.35, dread: 1.85, frenzy: 1.2, wraith: 1.3, stomp: 1 },',
      replace: '      bossPeak: { drone: 0, ride: 0, sub: 2.3, engine: 1.72, perc: 2.26, drive: 1.62, ownB: 1.76, toll: 1.5, dread: 4.2, frenzy: 1.6, wraith: 1.7, stomp: 2 },',
    },
  },
];
