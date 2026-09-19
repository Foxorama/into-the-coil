// The breaks behind docs/decisions/0330-the-black-heart-is-driven.md.
//
// ⚠️ THE FIRST IS THE FADER AS IT WAS DRIVEN, AND IT IS THE ONE MEASUREMENT THE DESK CANNOT MAKE. The
// hand put the title's kit at 3.19 and heard it through a bus that was saturating on it: that rung
// peaks at 1.482 of full scale into the shaper and measures −12.4 dB dirty against a ceiling of −16,
// where the same rung with no kit in it measures −27.3. A bus shaper distorts everything on the bus,
// so what a fader that hot actually does is put a kick drum's distortion on the guitars, the drone and
// the tune. The guard is what says so, and this is the state it says it about.
//
// ⚠️ THE SECOND IS A PLACE GOING ON FOLLOWING WHAT IT HAS BURIED, which is the failure
// docs/decisions/0189-a-place-is-what-it-does-not-play.md names and `LEADS`' own header records twice.
// It is the cheap half of a drive to forget — a ladder is edited, a lead is not, and nothing about the
// arrangement looks wrong until somebody measures whether the part is a part.
//
// ⚠️ AND TWO BREAKS ARE DELIBERATELY ABSENT, WHICH 0019 ASKS TO BE WRITTEN DOWN RATHER THAN LEFT.
//
// `nudge` back on `waitForTimeout(120)` — the wall-clock wait this decision replaced with a frame
// count — CANNOT be probed here, because the fault only appears when the machine is saturated. Under
// `prove-guard.mjs`'s own filtered run the suite is idle, 120 ms is seven frames, and the break would
// report STILL GREEN. That is the honest state: the fix is right, the load that exposes it is the
// whole suite, and a probe pointed at it would be theatre. `tests/frames.ts` carries the measurement.
//
// `NOT_STEADIER` emptied of one of its two places would redden 0166's second assertion — but the
// break it would prove is that a known-bad list is held in both directions, which is already 0164's
// probe with a different list under it. A second copy of one proof is not a second proof.
/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0330',
    suite: 'tests/themes.test.ts',
    broke: 'the kit back at the 3.19 it was driven to, which saturates the whole bus on a kick drum',
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'src/content/themes.ts',
      // ⚠️ Re-anchored by 0331, which replaced this opening with a ballad and CLOSED the kit in it —
      // `beat` is 0 at `run` now rather than 1.28. The break is the same one: the kit back at the 3.19
      // the desk drove it to. `ownC`'s 0.07276 is what makes this row this place's `run` and no other.
      find: 'ownC: 0.07276, ownD: 0, lead: 0, beat: 0,',
      replace: 'ownC: 0.07276, ownD: 0, lead: 0, beat: 3.19,',
    },
  },
  {
    decision: '0330',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ `engine` IS THE LEAD THIS ROW NAMED BEFORE THE DRIVE, and the drive left it 8 dB under the kit.
      Measured, it is a `pulse` at 2.9 dB clear of one; asked to be the `part` it was, it sits 6.1 dB
      under — over 0164's floor and not on the known list, which is what a lead nobody re-read costs.
    */
    broke: 'the place goes on following the layer its own drive buried',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/arrangement.ts',
      /*
        ⚠️ RE-AIMED BY 0331, BECAUSE THE BREAK'S SUBJECT STOPPED EXISTING. This made the place follow
        `engine` at `run`, and the ballad CLOSES `engine` there — every drum and guitar layer is shut
        from `run` to `approach` now. Following a layer a place does not open is a different defect
        with its own guard: `tests/arrangement.test.ts`'s 0155 caught it first and 0164 never fired, so
        `npm run prove` reported NOTHING WAS PROVEN. **A re-anchor that keeps the text and loses the
        claim is the failure this file's own header is about.**

        ⚠️ AND THE SECOND ATTEMPT REDDENED THE RIGHT GUARD FOR THE WRONG REASON — following `groove` at
        `surge` fires 0164's OTHER assertion, because displacing `counter` makes that layer clear the
        floor and it is on the known-adrift list. It proves the list is stale, not that a place follows
        something buried.

        ⚠️ SO IT IS THE PAD AT `push`: a layer this place OPENS (0.1276), whose displacement disturbs
        nothing on the list, and which measures **more than a whole role under** what a `part` asks —
        checked, and it is the first assertion that fires. 0330's claim is intact: the place goes on
        following the layer its own drive buried.
      */
      find: "  core: { run: 'call', push: 'hook',",
      replace: "  core: { run: 'call', push: 'drone',",
    },
  },
];
