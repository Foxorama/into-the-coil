// The serpent rears back — docs/decisions/0309-the-serpent-rears-back.md
//
// Every guard 0309 adds, broken on purpose. `node scripts/prove-guard.mjs 0309`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    // The state of `main`: it stands where it always stood and lunges as far in as it ever did.
    broke: 'the rear taken off the lightning phase, so the animal stands where it always stood',
    guard: 'THE REPORTED ONE: at the lightning phase it holds further off than it ever has, and the skull is still on the screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        rear: { stand: 10, lunge: 0.3, arch: 6, span: 44 },\n',
      replace: '',
    },
  },
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE HALF THAT LOOKS LIKE A TIDY-UP. `stand` alone moves the whole swing, which satisfies *it
      pulled back* on the near end — and takes the far end with it, toward the leading edge the skull has
      to stay inside. Without the lunge term the withdrawal has to come entirely out of the station, and
      the second assertion is what refuses it.
    */
    broke: 'the lunge left at full, so the whole withdrawal comes out of the station and the skull rears off the edge',
    guard: 'THE REPORTED ONE: at the lightning phase it holds further off than it ever has, and the skull is still on the screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        rear: { stand: 10, lunge: 0.3, arch: 6, span: 44 },',
      replace: '        rear: { stand: 29, lunge: 1, arch: 6, span: 44 },',
    },
  },
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    // The bow dropped out of the body: a withdrawal with no posture, which is a boss that repositioned.
    broke: 'the neck no longer bowing, so the rear is a reposition and not a posture',
    guard: 'and the NECK bows, which is what stops it reading as a boss that repositioned',
    edit: {
      path: 'src/app/frame.ts',
      find: '    node.across = followed + sway * Math.sin(w.chainPhase - (offset / chain.wavelength) * TAU) + bow;',
      replace: '    node.across = followed + sway * Math.sin(w.chainPhase - (offset / chain.wavelength) * TAU);',
    },
  },
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE GAP 0284 CLOSED, RE-OPENED — and it is the shape a hand reaching for *more tilt* would
      write. A turn authored as a number rather than derived from the bow leaves the skull facing
      somewhere its own neck does not go, and the guard compares the two rather than checking the number.
    */
    broke: 'the skull’s turn authored rather than derived, so the head faces somewhere its neck does not go',
    edit: {
      path: 'src/app/frame.ts',
      find: '  head.turn = turnFor(Math.PI + Math.atan(bowSlope));',
      replace: '  head.turn = turnFor(Math.PI + (reared === undefined ? 0 : 0.6 * w.bossBow));',
    },
    guard: 'and the SKULL turns with its own neck, which is what stops a gap opening behind it',
  },
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE EASE DELETED, WHICH IS THE ONE FAILURE NOTHING ELSE HERE SEES. Every other guard in the block
      is about where the body IS; this is about how fast it got there, and a bow assigned straight from the
      gaze puts the neck through the animal's own middle in a single step with twenty-six hurtboxes on it.
    */
    broke: 'the bow assigned straight from the gaze, so the neck crosses the animal’s own middle in one step',
    guard: 'and the bow EASES across when the player crosses it, because a neck cannot flip in a step',
    edit: {
      path: 'src/app/frame.ts',
      find: '  w.bossBow += Math.max(-BOW_PER_STEP, Math.min(BOW_PER_STEP, want - w.bossBow));',
      replace: '  w.bossBow = want;',
    },
  },
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND THE COST OF AN OPTIONAL FIELD, WHICH IS THE THING THE LAST GUARD IN THE BLOCK IS FOR. A
      `lunge` that defaulted to anything but one moves every bobbing boss in the game — six of them — and
      does it in the phases nobody is looking at, because the serpent's own last third states its value.
    */
    broke: 'the lunge defaulting to a half, so every phase of every bobbing boss stops lunging',
    guard: 'and nothing about the phases that do not rear has changed',
    edit: {
      path: 'src/app/boss.ts',
      find: '  const lunge = row.move.kind === \'bob\' && row.move.rear > 0 ? row.move.rear * (reared?.lunge ?? 1) : 0;',
      replace: '  const lunge = row.move.kind === \'bob\' && row.move.rear > 0 ? row.move.rear * (reared?.lunge ?? 0.5) : 0;',
    },
  },
  {
    decision: '0309',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND THE BEND RULE, AT THE SPAN THE FIRST DRAFT AUTHORED. Six over thirty-four measured **1.39** of
      the local girth against the rule's 1.5 — the bend goes as `span² / arch`, and this is the number the
      widened guard exists to have caught. It is green over the whole phase and red over the reared one,
      which is the whole reason the guard now drives both.
    */
    broke: 'the bow over the span the first draft authored, which kinks the neck at 1.39 of its own girth',
    guard: 'and no bend is tighter than the animal’s own spine allows, on the body that is actually on the screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: '        rear: { stand: 10, lunge: 0.3, arch: 6, span: 44 },',
      replace: '        rear: { stand: 10, lunge: 0.3, arch: 6, span: 34 },',
    },
  },
];
