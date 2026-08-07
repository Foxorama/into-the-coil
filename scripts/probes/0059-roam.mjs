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
      find: '      e.velAcross = (index + i) % 2 === 0 ? row.roam : -row.roam;',
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
      find: '    if (e.across <= ROAM_MIN) e.velAcross = row.roam;\n    else if (e.across >= ROAM_MAX) e.velAcross = -row.roam;',
      replace: '    if (e.across <= 0) e.velAcross = row.roam;\n    else if (e.across >= ACROSS_SPAN) e.velAcross = -row.roam;',
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
      find: '    if (e.across <= ROAM_MIN) e.velAcross = row.roam;\n    else if (e.across >= ROAM_MAX) e.velAcross = -row.roam;',
      replace: '    void ROAM_MIN;\n    void ROAM_MAX;',
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
        '    if (row.weaveAmplitude > 0 && row.weaveWavelength > 0) {\n' +
        '      const wk = TAU / row.weaveWavelength;\n' +
        '      e.velAcross = row.weaveAmplitude * wk * Math.cos(e.along * wk) * e.velAlong;\n' +
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
      find: '    if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) continue;\n    e.fireIn--;',
      replace: '    e.fireIn--;',
    },
  },
  {
    decision: '0059',
    suite: 'tests/level.test.ts',
    // The content half. A weave wide enough to carry its outermost member past the band is a wave that
    // deletes part of itself, and the table gives no sign of it.
    broke: 'a weave widened past what the authored lanes leave room for',
    guard: 'never puts an enemy where it can leave the ROAM band and be culled',
    edit: { path: 'src/content/enemies.ts', find: '    weaveAmplitude: 16,', replace: '    weaveAmplitude: 26,' },
  },
];
