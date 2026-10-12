// The breaks behind docs/decisions/0605-a-place-rebakes-only-what-it-changes.md.
//
// ⚠️ WHAT IS HELD IS THE ATLAS AND NOT THE LIST — docs/decisions/0192-a-guard-holds-an-invariant.md.
// Each break below leaves some slot of the next place's atlas drawn as the last place drew it, which
// is the one way lending can be wrong; the last one makes the lending stop, which is the one way it
// can be useless while every comparison stays green.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    // A kind that reads the place, left off the list: every place's drifter would be the first one's.
    broke: 'the drifter left off the place-drawn list, so it is carried from place to place',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: "  'drifter', 'drifterHit', 'lancer', 'lancerHit', 'weaver', 'weaverHit', 'turret', 'turretHit',",
      replace: "  'drifterHit', 'lancer', 'lancerHit', 'weaver', 'weaverHit', 'turret', 'turretHit',",
    },
  },
  /*
    ⚠️ SLOTS WRITTEN AFTER THE BAKE, LENT. Each is place-free as `bakeOne` draws it and is repainted
    afterwards, so the atlas on screen holds it as the last fit or the last place left it. Only a guard
    that paints the place being left before it lends can see these.

    ⚠️ THE FIRST OF THESE CAME BACK STILL GREEN AND WAS RIGHT TO: it un-listed the gas, which differs
    by place and is re-baked through `PLACE_DRAWN` anyway, so the break broke nothing. The three below
    are the slots the after-bake list is the ONLY thing re-baking.
  */
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    broke: 'the fitted ship’s hulls lent, so the next place flies the last fit',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: '    for (const hull of SHIPS[ship].hulls) rebaked.push(hull.base, hull.hit);',
      replace: '',
    },
  },
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    broke: 'the fitted ship’s dance lent, so it dances in the last fit',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: '    for (const cycle of SHIPS[ship].dance) rebaked.push(...cycle.frames);',
      replace: '',
    },
  },
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    broke: 'the flame lent, so the next place burns the last flame',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: '  for (const thrust of THRUST_KINDS) for (const lean of LEAN_KINDS) rebaked.push(...THRUST[thrust].frames[lean]);',
      replace: '',
    },
  },
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    broke: 'the Mire’s banks lent out of the Mire in its own land colours',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: "  for (const kind of ['mireBank', ...MIRE_BANK_CAPS, ...MIRE_BED, ...MIRE_ACID_CAPS] as const) rebaked.push(SPRITE[kind]);",
      replace: '',
    },
  },
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    // Everything lent: the list ignored, so the next place is the last one's picture under a new sky.
    broke: 'every slot lent whatever it draws',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: '    if (kept !== null && kept[i] === true) {',
      replace: '    if (kept !== null) {',
    },
  },
  {
    decision: '0605',
    suite: 'tests/place-drawn.browser.test.ts',
    // Nothing lent: correct in every slot, and the saving gone — which no comparison can see.
    broke: 'nothing lent, so every place change bakes every bitmap again',
    guard: 'and the atlas it lends into is the atlas a fresh bake of the next place draws',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const lends = keep !== null && keep.view === view && keep.pixelsPerUnit === pixelsPerUnit;',
      replace: '  const lends = false && keep !== null && keep.view === view && keep.pixelsPerUnit === pixelsPerUnit;',
    },
  },
];
