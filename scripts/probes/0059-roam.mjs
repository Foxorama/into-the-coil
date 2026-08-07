// The breaks behind docs/decisions/0059-the-lane-is-the-players-box.md.
//
// ⚠️ Four of these six leave a screen that looks completely reasonable. An enemy that turns round at
// the lane edge instead of past it is a wider tunnel and still a tunnel; a body that never turns round
// at all is culled and simply is not there any more, which reads as a level with a hole in it rather
// than as a bound being wrong. What separates them is where the body GOES, so five of the six drive
// the real frame for as long as it takes a drifter to cross the band and come back.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0059',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE REPORTED ONE. Without a starting direction there is no roam at all, and the two rows with
      `closing: 0` go back to being the stillest things in the game — which is the middle of what was
      described as the narrow tunnel.
    */
    broke: 'the roam never started, so anything holding station holds it forever',
    guard: 'takes something that holds station clear off the edge of the screen',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0073, which made the motion a union: only a drifting row is given a
      // starting direction, because a reactive one recomputes `velAcross` from the ship every step.
      find: "      e.velAcross = row.motion.kind === 'drift' ? ((index + i) % 2 === 0 ? row.motion.roam : -row.motion.roam) : 0;",
      replace: '      e.velAcross = 0;',
    },
  },
  {
    decision: '0059',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE TIDY-LOOKING ONE, and the one this decision is really about. Turning round at the lane
      edges is what every other bouncing thing in the game does — `driftPickups` and the boss's patrol
      both do exactly this — so it is what somebody would write, and it produces a tunnel one lane
      wide with the enemies pressed against its walls.
    */
    broke: 'the roam turning round at the LANE edges rather than outside them',
    guard: 'takes something that holds station clear off the edge of the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (e.across <= ROAM_MIN) e.velAcross = m.roam;\n        else if (e.across >= ROAM_MAX) e.velAcross = -m.roam;',
      replace: '        if (e.across <= 0) e.velAcross = m.roam;\n        else if (e.across >= ACROSS_SPAN) e.velAcross = -m.roam;',
    },
  },
  {
    decision: '0059',
    suite: 'tests/spawns.test.ts',
    // No turn at all: every roaming body walks out of the band and meets 0048's `across` cull. The
    // pool recovers, nothing errors, and the level quietly loses everything that was not a charger.
    broke: 'the turn dropped, so a roaming body walks out of the band and is culled',
    guard: 'never leaves the roam band, so nothing that wandered off is culled',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (e.across <= ROAM_MIN) e.velAcross = m.roam;\n        else if (e.across >= ROAM_MAX) e.velAcross = -m.roam;',
      replace: '        void ROAM_MIN;\n        void ROAM_MAX;',
    },
  },
  {
    decision: '0059',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE OLD ORDER, restored exactly. The weave used to run before the flanker's turn and overwrote
      it, and the suite held a rule about what a LEVEL AUTHOR may write instead of a rule the code
      keeps. Nothing in the shipped script trips it, which is what makes it invisible.
    */
    broke: 'the weave put back in front of the flanker’s turn, so a weaving flanker never arrives',
    guard: 'a WEAVING row can arrive from the side now',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (e.steerAcross !== 0) {\n      if (e.velAcross > 0 ? e.across < e.steerAcross : e.across > e.steerAcross) continue;',
      replace:
        // ⚠️ Re-anchored by 0073. The weave is one arm of a union now; what is restored is the old
        // ORDER, which is what this probe has always been about.
        "    if (row.motion.kind === 'weave') {\n" +
        '      const wk = TAU / row.motion.wavelength;\n' +
        '      e.velAcross = row.motion.amplitude * wk * Math.cos(e.along * wk) * e.velAlong;\n' +
        '      continue;\n' +
        '    }\n' +
        '    if (e.steerAcross !== 0) {\n' +
        '      if (e.velAcross > 0 ? e.across < e.steerAcross : e.across > e.steerAcross) continue;',
    },
  },
  {
    decision: '0059',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE ONE THE ROAM CREATES. A turret that wanders off the screen and goes on firing is a hit
      with no cause on the picture, which
      `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` records being
      reported three separate times as a collision fault that did not exist.
    */
    broke: 'a body that has wandered off the screen still shooting from out there',
    guard: 'something that has wandered off the screen does not shoot from there',
    edit: {
      path: 'src/app/frame.ts',
      /*
        ⚠️ Re-anchored by 0073, which put the LEADING-edge twin of this check directly underneath it.
        The find can no longer run on to `e.fireIn--`, and the break is narrowed to the `across` line
        this decision owns — the `along` one has its own probe under 0073.
      */
      find: '    if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) continue;',
      replace: '',
    },
  },
  {
    decision: '0059',
    suite: 'tests/level.test.ts',
    // The content half. A weave wide enough to carry its outermost member past the band is a wave that
    // deletes part of itself, and the table gives no sign of it.
    broke: 'a weave widened past what the authored lanes leave room for',
    guard: 'never puts an enemy where it can leave the ROAM band and be culled',
    edit: {
      path: 'src/content/enemies.ts',
      // ⚠️ Re-anchored by 0073: the weave's two numbers are the parameters of one arm of a union now.
      find: "    motion: { kind: 'weave', amplitude: 16, wavelength: 130 },",
      replace: "    motion: { kind: 'weave', amplitude: 26, wavelength: 130 },",
    },
  },
];
