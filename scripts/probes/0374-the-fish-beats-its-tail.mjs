// The fish beats its tail — docs/decisions/0374-the-fish-beats-its-tail.md
//
// Every guard 0374 adds, broken on purpose. `node scripts/prove-guard.mjs 0374`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0374',
    suite: 'tests/volans.test.ts',
    // THE ASKED-FOR ONE: the sweep zeroed, so the tail is a body behind the hull that never moves.
    broke: 'the sweep zeroed, so the tail is rooted and never beats',
    guard: 'THE ASKED-FOR ONE: the tail is a body of its own behind the hull, rooted on the peduncle, and it BEATS',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0381, which grew the fish and re-tuned the beat.
      find: 'tail: { art: VOLANS_TAIL, root: 16, beat: 32, sweep: 0.34, yaw: 0 },',
      replace: 'tail: { art: VOLANS_TAIL, root: 16, beat: 32, sweep: 0, yaw: 0 },',
    },
  },
  {
    decision: '0374',
    suite: 'tests/volans.test.ts',
    // The root ignored: the tail laid on the hull's centre, beating out of the middle of the animal.
    broke: 'the tail laid on the hull’s centre rather than on the peduncle',
    guard: 'THE ASKED-FOR ONE: the tail is a body of its own behind the hull, rooted on the peduncle, and it BEATS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  body.along = head.along + Math.cos(head.turn) * tail.root;\n  body.across = head.across + Math.sin(head.turn) * tail.root;',
      replace: '  body.along = head.along;\n  body.across = head.across;',
    },
  },
  /*
    ⚠️ A PROBE WENT HERE WITH THE YAW — docs/decisions/0381-the-fish-is-bigger.md. *The hull no longer
    yawing against the beat* broke 0374's yaw, and the play called the yaw *"funky and weird"*: the
    row's `yaw` is zero and the guard now holds that the hull HOLDS its heading. A break of a line
    that multiplies by zero would prove nothing, which is what `npm run prove` calls STILL GREEN.
  */
  {
    decision: '0374',
    suite: 'tests/volans.test.ts',
    // The hurt twin never worn: the flesh flashes and the fin stays lit.
    broke: 'the tail never wearing its hurt twin, so a hit lights the animal minus its fin',
    guard: 'and the tail wears the hull’s own hurt',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const worn = head.flashFor > 0 ? art.spriteHit : art.sprite;',
      replace: '  const worn = art.sprite;',
    },
  },
  {
    decision: '0374',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE FIN PUT BACK ON THE BODY: the calm hull's stump replaced by the caudal fin 0318 drew into
      it, so the animal has a tail painted on and a second one beating behind it.
    */
    broke: 'the caudal fin painted back onto the body, so the fish has two tails',
    guard: 'and the body has no tail of its own any more',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ Re-anchored by 0381, which shortened the stump so it ends inside the fin's base.
      find: '  [0.78, 0.12],\n  [0.74, 0.16],\n  [0.7, 0.17],\n  [0.58, 0.25],\n  [0.5, 0.42],',
      replace: '  [0.95, 0.28],\n  [1, 0.52],\n  [1, 0.52],\n  [0.9, 0.36],\n  [0.74, 0.16],\n  [0.7, 0.17],\n  [0.58, 0.25],\n  [0.5, 0.42],',
    },
  },
  {
    decision: '0374',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE TAIL LAID IN THE FIRST SLOT, which the flame loop then overwrites with an ember: on the
      burning fish the fin is drawn as fire, and on the cold one it is drawn at all only because
      nothing else wants the slot.
    */
    broke: 'the tail laid in the first slot of the layer, under the fire and overwritten by it',
    guard: 'and it is laid LAST in the layer behind the hull',
    edit: {
      path: 'src/app/frame.ts',
      find: 'layTail(w, head, tail, look?.tail ?? tail.art, w.bossAura.at(want - 1), fresh);',
      replace: 'layTail(w, head, tail, look?.tail ?? tail.art, w.bossAura.at(0), fresh);',
    },
  },
];
