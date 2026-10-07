// The breaks behind docs/decisions/0575-a-pickup-is-what-it-shows.md.
//
// ⚠️ A drawn pickup is three draws and a wait — the kind, the face, the run's own seed — and the key
// that teaches it. A break in any one is a pickup that is the same every time, or turns, or leaves
// before it bounces, and the field still looks fine in a still.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0575',
    suite: 'tests/weapons.test.ts',
    broke: 'every place drawn as the first drawn kind',
    guard: 'draws a kind with even odds',
    edit: {
      path: 'src/content/pickups.ts',
      find: '  return DRAWN_KINDS[rng.int(0, DRAWN_KINDS.length - 1)]!;',
      replace: '  return DRAWN_KINDS[0]!;',
    },
  },
  {
    decision: '0575',
    suite: 'tests/weapons.test.ts',
    broke: 'every pickup put on its row’s first face',
    guard: 'and hands over the face it shows, never the row’s first',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const face = drawFace(row, rng);',
      replace: '  const face = 0;',
    },
  },
  {
    decision: '0575',
    suite: 'tests/pickups.test.ts',
    broke: 'a dropped piece put on its row’s first face',
    guard: 'and each dropped piece is drawn on a face of its own and keeps it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const face = drawFace(row, rng);',
      replace: '  const face = 0;',
    },
  },
  {
    decision: '0575',
    suite: 'tests/continue.test.ts',
    broke: 'every run dealt its pickups from one fixed seed',
    guard: 'a run begun on a seed draws what that seed draws',
    edit: {
      path: 'src/app/lifecycle.ts',
      find: "      world.pickupRng = makeRng(seedRun()).stream('pickups');",
      replace: "      world.pickupRng = makeRng('proof-scene').stream('pickups');",
    },
  },
  {
    decision: '0575',
    suite: 'tests/pickups.test.ts',
    // The ten seconds the cycle's repetitions hid: the pickup falls back the box's length and leaves.
    broke: 'the wait back at ten seconds, too short to bounce',
    guard: 'and it turns only where it hits something',
    edit: {
      path: 'src/app/frame.ts',
      find: 'export const PICKUP_LINGER_STEPS = 900;',
      replace: 'export const PICKUP_LINGER_STEPS = 600;',
    },
  },
  {
    decision: '0575',
    suite: 'tests/hud.browser.test.ts',
    broke: 'the key’s faces stacked in one cell, as 0432 drew them',
    guard: 'one row per pickup, every face it may be drawn on standing at once, apart, and still',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-guide-key-faces { display: flex; flex-wrap: wrap;',
      replace: '.itc-guide-key-faces > * { grid-area: 1 / 1; }\n.itc-guide-key-faces { display: grid; flex-wrap: wrap;',
    },
  },
];
