// The acid and the void come as one ball — docs/decisions/0311-the-acid-and-the-void-come-as-one-ball.md
//
// Every guard 0311 adds, broken on purpose. `node scripts/prove-guard.mjs 0311`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    // The state of `main`: the sweep and the void fan back in the round, which is what *boring* was.
    broke: 'the sweep put back in the last third, so two volleys in three are twenty-four bullets again',
    guard: 'THE REPORTED ONE: the last third throws ONE ball where it threw twenty-four bullets',
    edit: {
      path: 'src/content/bosses.ts',
      find: "            { shot: 'maw', attack: { kind: 'lob' } },",
      replace:
        "            { shot: 'acid', attack: { kind: 'sweep', from: Math.PI / 3, to: (11 * Math.PI) / 6, globes: 21, every: 3 } },",
    },
  },
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE ARM THAT SPENDS THE PHASE'S COUNT, WHICH IS THE THING `lob` EXISTS NOT TO DO. A `spray` here
      throws THREE balls — ninety points of appetite the player cannot finish and three explosions they
      cannot all be away from — and it satisfies *the last third throws a ball* in every other respect.
    */
    broke: 'the ball thrown as a spray, so the phase’s three become three balls at once',
    guard: 'THE REPORTED ONE: the last third throws ONE ball where it threw twenty-four bullets',
    edit: {
      path: 'src/content/bosses.ts',
      find: "            { shot: 'maw', attack: { kind: 'lob' } },",
      replace: "            { shot: 'maw', attack: { kind: 'spray' } },",
    },
  },
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    // The appetite taken off, so the player cannot touch it at all — 0291's switch, not a tuning number.
    broke: 'the ball no longer swallowing, so the player cannot touch it',
    guard: 'and it EATS the player’s fire and grows, which is the only thing that says it is eating',
    edit: {
      path: 'src/content/shots.ts',
      find: '    swallows: true,\n    /*\n      ⚠️ **35.6 IS',
      replace: '    /*\n      ⚠️ **35.6 IS',
    },
  },
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    // The fuse on a place, deleted: it flies past the player and out of the world like any other bullet.
    broke: 'the ball never bursting, so it flies past the player and out of the world',
    guard: 'and if it is NOT killed it bursts where the row says, into acid and void together',
    edit: {
      path: 'src/app/frame.ts',
      find:
        '      if (row.swallow !== undefined && blast.along - w.cameraAlong <= row.swallow.at) burstMaw(w, i, row);',
      replace: '',
    },
  },
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ ONE INK RATHER THAN TWO, WHICH IS THE HALF `fission` COULD NEVER DO. A ring of void alone is a
      burst by every other measure — it is at the right place, it scales with health, it is a circle —
      and it is not *a blast of acid and void droplets*.
    */
    broke: 'the burst all one kind, so it is a void ring rather than acid and void together',
    guard: 'and if it is NOT killed it bursts where the row says, into acid and void together',
    edit: {
      path: 'src/content/shots.ts',
      find: "    swallow: { at: 35.6, into: ['droplet', 'void'], droplets: 16, speed: 0.85 },",
      replace: "    swallow: { at: 35.6, into: ['void'], droplets: 16, speed: 0.85 },",
    },
  },
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE BLAST THAT IGNORES WHAT THE PLAYER DID. A fixed count is the obvious way to write this and it
      is the version where shooting the ball buys nothing but the chance of killing it outright — which is
      most of the reason to shoot it at all.
    */
    broke: 'the blast a fixed size, so hurting the ball buys the player nothing',
    guard: 'and the blast is SMALLER for a ball the player hurt, which is the reward for shooting it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const count = Math.max(2, Math.round(swallow.droplets * share));',
      replace: '  const count = swallow.droplets;',
    },
  },
  {
    decision: '0311',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE CHAIN, AND IT IS THE STATE THE CODE WAS IN BEFORE ONE LINE WAS ADDED. A void that is emptied
      bursts into seven shards of its own kind, and the ball inherits that — so the player who does exactly
      what they were asked gets seven more balls, each bursting again where it arrives.
    */
    broke: 'the emptied ball bursting like a void, so killing it hands the player seven more',
    guard: 'and KILLING it leaves nothing behind, which is the whole reward for shooting it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (SHOT_ROWS[spent.kind]!.swallow !== undefined) {',
      replace: '  if (false) {',
    },
  },
];
