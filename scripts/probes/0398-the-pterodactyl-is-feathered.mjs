// The pterodactyl is feathered — docs/decisions/0398-the-pterodactyl-is-feathered.md
//
// Every guard 0398 adds, broken on purpose. `node scripts/prove-guard.mjs 0398`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0398',
    suite: 'tests/quetzal.test.ts',
    // The quills thrown from the hull's centre again, which is where every spray left from before.
    broke: 'the quills thrown from the chest rather than off the wings',
    guard: 'THE ASKED-FOR ONE, THE QUILLS',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    attack: { kind: 'spray', from: WINGS },",
      replace: "    attack: { kind: 'spray' },",
    },
  },
  {
    decision: '0398',
    suite: 'tests/quetzal.test.ts',
    // The quill drawn at the lance's size — the *"tiny bullet shaped thing"* that was reported.
    broke: 'the quill drawn at the lance’s 1.9 units',
    guard: 'THE ASKED-FOR ONE, THE QUILLS',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  quill: 5.6,',
      replace: '  quill: 1.9,',
    },
  },
  {
    decision: '0398',
    suite: 'tests/quetzal.test.ts',
    // The wing beams back at the wingtips' eighteen, where no cannon is drawn.
    broke: 'the wing beams fired from eighteen units out, past the shoulder cannons',
    guard: 'THE SHOULDER CANNONS',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'const SHOULDER = 11;',
      replace: 'const SHOULDER = 18;',
    },
  },
  {
    decision: '0398',
    suite: 'tests/quetzal.test.ts',
    // The face shuts the moment the volley is thrown, while its laser is still warning and burning.
    broke: 'the beak shut and the cannons dark while the laser is still on the screen',
    guard: 'THE TELL IS THE BODY',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (boss.fireIn <= FACE_GAPE || boss.sprayLeft > 0 || spitting || boss.holdFor > 0) {',
      replace: '  if (boss.fireIn <= FACE_GAPE || boss.sprayLeft > 0 || spitting) {',
    },
  },
  {
    decision: '0398',
    suite: 'tests/quetzal.test.ts',
    // The wings never wearing their hurt frames: a hit lights the animal minus its wings.
    broke: 'the wings not lit by a hit that lights the body',
    guard: 'THE WINGS BEAT, AND A HIT LIGHTS THEM WITH THE BODY',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const hurt = aura.hurt !== undefined && head.flashFor > 0 ? aura.hurt : undefined;',
      replace: '    const hurt: readonly number[] | undefined = undefined;',
    },
  },
];
