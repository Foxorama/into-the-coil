// The serpent darkens — docs/decisions/0305-the-serpent-darkens.md
//
// Every guard 0305 adds, broken on purpose. `node scripts/prove-guard.mjs 0305`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0305',
    suite: 'tests/serpent.test.ts',
    // The frame never laying the aura, whatever the phase authors: a look nobody draws.
    broke: 'the aura authored and never laid, so the void phase looks like the whole one',
    guard: 'the void phase burns with an aura behind every node and the head',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const aura = head === null ? null : (phaseFor(w.bossRow, head.health, w.bossFullHealth).look?.aura ?? null);',
      replace: '  const aura = null;',
    },
  },
  {
    decision: '0305',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE AURA IN FRONT OF THE BODY — one word moved in a list, and every flame then lies over the
      flesh of the node beside it. Nothing in the model changes and every flame is still where its
      node is, which is why the guard reads the game's own draw order.
    */
    broke: 'the aura drawn after the body, so its flames lie over the flesh they rise off',
    guard: 'the void phase burns with an aura behind every node and the head',
    edit: {
      path: 'src/app/mount.ts',
      find: '    layers: [blasts, pickupPool, bossAura, bossBody, bossPool,',
      replace: '    layers: [blasts, pickupPool, bossBody, bossAura, bossPool,',
    },
  },
  {
    decision: '0305',
    suite: 'tests/serpent.test.ts',
    // Every flame on the same frame at the same moment: the whole animal blinks.
    broke: 'the flicker not offset from node to node, so the aura blinks rather than flickers',
    guard: 'and it FLICKERS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const frame = aura.frames[(((tick + k * aura.stride) % n) + n) % n]!;',
      replace: '    const frame = aura.frames[(((tick + 0 * k) % n) + n) % n]!;',
    },
  },
  {
    decision: '0305',
    suite: 'tests/serpent.test.ts',
    // The lightning phase's horns no longer than the void phase's: *"a bit longer again"* dropped.
    broke: 'the lightning phase’s horns drawn at the void phase’s length',
    guard: 'the horns grow at the void phase and grow again at the lightning',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const HORN_GROWTH = { 2: 1.5, 3: 2 } as const;',
      replace: 'const HORN_GROWTH = { 2: 1.5, 3: 1.5 } as const;',
    },
  },
  {
    decision: '0305',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE HEAD GROWN INSTEAD OF THE HORNS — the frame left at the bigger box's size, so the whole
      skull draws half again as big. The horns reach further, so the first half of the guard is met;
      what goes red is the jaw moving, which is the half that says *the horns grew and nothing else*.
    */
    broke: 'the bigger box drawn at its own scale, so the whole skull grows rather than the horns',
    guard: 'the horns grow at the void phase and grow again at the lightning',
    edit: {
      path: 'src/render/bake.ts',
      find: '      const fs: Frame = { half, r: r / skull.box };',
      replace: '      const fs: Frame = { half, r };',
    },
  },
  {
    decision: '0305',
    suite: 'tests/serpent.test.ts',
    // Red lightning on every frame of the storm: a red aura, not a flicker through one.
    broke: 'the lightning on every frame of the storm, so it glows red rather than flickering',
    guard: 'and the red lightning is through the lightning phase’s aura',
    edit: {
      path: 'src/render/bake.ts',
      find: '  if (!storm || !STORM_LIT.includes(frame)) return;',
      replace: '  if (!storm) return;',
    },
  },
];
