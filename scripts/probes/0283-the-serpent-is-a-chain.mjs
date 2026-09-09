// The serpent is a chain — docs/decisions/0283-the-serpent-is-a-chain.md
//
// Every guard 0283 adds, broken on purpose. `node scripts/prove-guard.mjs 0283`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0283',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, IN ONE LINE: A BODY THAT IS CARRIED RATHER THAN
      ALIVE.** Every node reads the head's lane directly — no lag, no wave — so the animal keeps one
      shape and slides about with its skull. That is exactly what was reported, twice: *"it's a static
      image that bounces up and down"* and *"there's no movement to the sprite itself."*
    */
    broke: 'the body a rigid offset from the head, so it is a picture being carried rather than an animal',
    guard: 'THE REPORTED ONE: the body moves, and it moves differently from the head',
    edit: {
      path: 'src/app/frame.ts',
      find: '    node.across = followed + sway * Math.sin(w.chainPhase - (offset / chain.wavelength) * TAU);',
      replace: '    node.across = head.across;',
    },
  },
  {
    decision: '0283',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE NECK BURIED IN THE SKULL, WHICH IS WHAT THE FIRST DRAFT DID.** With the body starting
      at the head's own centre the first two points of the spine are the same point — a joint with no
      length — and the guard measured it as a bend radius of **0.13 of its own girth**.
    */
    broke: 'the body starting at the head’s centre, so the neck is inside the skull and the joint has no length',
    guard: 'no bend is tighter than the animal’s own spine allows',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0284 (6.5 → 3) and again by 0288, which grew the skull the neck is measured against.
      find: '      neck: 3.6,',
      replace: '      neck: 0,',
    },
  },
  {
    decision: '0283',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE WAVE TIGHTENED UNTIL THE ANIMAL KINKS**, which is the fault the bend rule is named for
      and the one this decision had to solve twice: `L² / 4π²A` is the tightest radius a body waving
      with wavelength `L` and amplitude `A` reaches, and at fifty-five it measured 1.25 of the
      midriff's own girth. Thirty is a serpent tying itself in knots.
    */
    broke: 'the undulation tightened, so the animal turns inside its own width',
    guard: 'no bend is tighter than the animal’s own spine allows',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      wavelength: 80,',
      replace: '      wavelength: 30,',
    },
  },
  {
    decision: '0283',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE BODY MADE DECORATION.** Whatever lands on a node is spent on the head by `drainChain`;
      drop that and the animal is a hurt shape the player can shoot all day for nothing, with a small
      disc round its skull the only thing that counts. The request 0277 could not answer — *"we need
      to update the boss collision to no longer be a disc if we can"* — undone in one line.
    */
    broke: 'what lands on the body never reaching the animal, so the serpent is a disc round its skull again',
    guard: 'the body is one animal: a hit anywhere on it is a hit on the serpent',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const onBody = drainChain(w);',
      replace: '    const onBody = 0;\n    drainChain(w);',
    },
  },
  {
    decision: '0283',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **THE CROISSANTS, PUT BACK IN ONE WORD.** `seal` is what every other hull in the game does
      and is exactly wrong for a slice of one: a disc outlined all the way round has that outline
      drawn over the flesh of the node beside it, and eleven of them rule a dark arc across the
      animal eleven times. It was photographed before it was guarded.
    */
    broke: 'a node of the body sealed like a hull, so its rim is drawn across the node beside it',
    guard: 'is more fills in the SAME bitmap, and not a second sprite over the first',
    edit: {
      path: 'src/render/bake.ts',
      find: "      ring(ctx, f, 0, 0, FLESH);\n      if (skin !== null) ctx.fillStyle = skin.hull;\n      ctx.fill('evenodd');",
      replace: '      ring(ctx, f, 0, 0, FLESH);\n      if (skin !== null) ctx.fillStyle = skin.hull;\n      seal(ctx);',
    },
  },
  {
    decision: '0283',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ **THE SKULL PUSHED PAST THE LEADING EDGE**, which is what this guard holds now.

      ⚠️ **IT USED TO LENGTHEN THE BODY, AND 0286 MADE THAT A FEATURE.** The original break spaced the
      chain out until the tail hung off the narrowest screen, on 0283's reasoning that the guard had
      to read the body's own reach rather than the head's radius. `docs/decisions/0286-a-serpent-runs-off-the-screen.md`
      answered *"it should be long enough to stretch off the screen for a serpent"* by ruling the
      opposite: what the guard protects is that the part the player has to FIGHT is reachable, so it
      reads `radius` again and the body is held by a claim of its own.

      ⚠️ **AND THE PROBE WAS CAUGHT BY THE HARNESS RATHER THAN BY A READER — 0019.** It went on going
      red, on 0286's new guard instead of this one, and `WRONG TEST` is the only reason anybody knew:
      a probe that reddens *something* is a probe that proves nothing about the guard it names.
    */
    broke: 'the skull pushed past the leading edge, so the part the player has to fight is off screen',
    guard: 'the whole hull stays on screen on the narrowest device',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0289, which moved the station back to 130 to buy the lunge its room.
      find: '    station: 130,\n    drift: 5,\n    driftWavelength: 240,',
      replace: '    station: 171,\n    drift: 5,\n    driftWavelength: 240,',
    },
  },
  {
    decision: '0283',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ **A POOL PAYING FOR ITSELF OUT OF NOTHING**, which is 0050's own break on the pool this one
      takes its slots from — and worth its own probe here because 0283 is the decision that spent
      them. The pools total exactly 500 and a body added on top is a frame asked to draw 511.
    */
    broke: 'the serpent’s body added to the pools without taking the slots from anywhere',
    guard: 'never asks the frame to draw more entities than the budget was measured for',
    edit: {
      path: 'src/app/mount.ts',
      find: '  debris: 200 - MAX_SHIELDS - 1 - 24 - 8 - 4 - 11,',
      replace: '  debris: 200 - MAX_SHIELDS - 1 - 24 - 8 - 4,',
    },
  },
];
