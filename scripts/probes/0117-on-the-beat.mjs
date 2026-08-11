// The breaks behind docs/decisions/0117-a-section-change-lands-on-the-beat.md.
//
// ⚠️ EVERY ONE OF THESE RESTORES A BEHAVIOUR THE GAME HAD UNTIL TODAY. That is what makes them worth
// having: the defect looked exactly like working code for the whole life of the project, and the only
// thing that ever caught it was an instrument (0116) built to render a level rather than a rung.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0117',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE DEFECT ITSELF, PUT BACK. `setTargetAtTime(target, ctx.currentTime, …)` is what the mixer
      did for the whole life of the project, and 27 of the game's 28 rung changes therefore landed
      mid-bar. It is one argument, it reads as obviously correct, and it is the reason two rounds of
      "push and surge sound the same" were answered with a gain.
    */
    broke: 'the ramp started when the frame noticed rather than on the next downbeat, which is what it always did',
    guard: 'THE REPORTED ONE: every layer that carries the arrangement moves on a bar line',
    edit: {
      path: 'src/app/music.ts',
      find: '    writes.push({ layer, target, at: aura ? now : bar, tau: (aura ? AURA_RAMP_SECONDS : RAMP_SECONDS) / 3 });',
      replace: '    writes.push({ layer, target, at: now, tau: (aura ? AURA_RAMP_SECONDS : RAMP_SECONDS) / 3 });',
    },
  },
  {
    decision: '0117',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE OVER-CORRECTION, WHICH LOOKS LIKE CONSISTENCY. Quantising the aura as well would be one
      fewer special case and would be wrong: 0091's aura tracks a gap the PLAYER steers, so a dread
      that waited for the downbeat would report where they were rather than where they are. Its ramp
      is already a quarter of a level change's for exactly this reason.
    */
    broke: 'the aura quantised too, so the dread reports where the player was rather than where they are',
    guard: 'AND THE AURA IS NOT QUANTISED, because it is tracking something the player steers',
    edit: {
      path: 'src/app/music.ts',
      find: '    writes.push({ layer, target, at: aura ? now : bar, tau: (aura ? AURA_RAMP_SECONDS : RAMP_SECONDS) / 3 });',
      replace: '    writes.push({ layer, target, at: bar, tau: (aura ? AURA_RAMP_SECONDS : RAMP_SECONDS) / 3 });',
    },
  },
  {
    decision: '0117',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE ONE THAT MAKES THE FIX WORSE THAN THE DEFECT. `setLevel` runs every frame; rewriting a
      layer whose destination has not moved re-schedules a ramp that is halfway through, holding it
      at its current value until the NEXT bar and then resuming. A build that should be one smooth
      move becomes a staircase in bar-sized steps — and every guard about the ladder stays green,
      because the targets are all correct.
    */
    broke: 'every layer rewritten every frame, so a ramp in progress is stalled at each bar line',
    guard: 'THE STAIR-STEP: a layer whose destination has not moved is not rewritten',
    edit: {
      path: 'src/app/music.ts',
      find: '    if (!aura && lastTargets[layer] === target) continue;',
      replace: '    if (false) continue;',
    },
  },
  {
    decision: '0117',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE GRID READ OFF THE WALL CLOCK RATHER THAN OFF THE MUSIC. `anchorAudio` is position zero of
      every loop and moves with a rephase (0094); a grid computed from zero would be right only until
      the first correction, and then silently wrong for the rest of the session — the failure mode
      0094 exists for, arriving in the thing that was supposed to be locked to it.
    */
    broke: 'the bar grid measured from the context clock rather than from the loops’ own anchor',
    guard: 'THE GRID: the next bar is on the music’s own clock, never on the wall',
    edit: {
      path: 'src/app/music.ts',
      find: '  const since = now - anchor;\n  if (since <= 0) return anchor;\n  return anchor + Math.ceil(since / BAR_SECONDS) * BAR_SECONDS;',
      replace: '  if (now <= anchor) return anchor;\n  return Math.ceil(now / BAR_SECONDS) * BAR_SECONDS;',
    },
  },
];
