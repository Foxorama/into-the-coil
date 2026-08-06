// The breaks behind docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md.
//
// ⚠️ Every one of these leaves a screen that looks completely right. A pickup drawn as one thing and
// handed over as another is correct in every screenshot; a phase read from a clock is correct in
// every screenshot AND in most motion; a face written back onto the entity is correct on the frame it
// happens. What separates them is what the player gets, which is why three of the six drive the real
// frame across a phase boundary rather than checking a table.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0052',
    suite: 'tests/cycling.test.ts',
    /*
      ⚠️ THE ONE THE WHOLE DECISION IS ABOUT. The face is computed twice — once for the sprite, once
      for the collection — and here the second one is a phase behind. The field draws what it is
      about to become, so a player flies for a shield and is handed an extra life. In a still image
      the game is perfect.
    */
    broke: 'the collection reading a different phase from the one the field is drawing',
    guard: 'hands over the face on the field, in both phases',
    edit: {
      path: 'src/app/frame.ts',
      find: '      const face = w.pickupFlipped ? (w.pickupCycle[index] ?? index) : index;',
      replace: '      const face = index;',
    },
  },
  {
    decision: '0052',
    suite: 'tests/cycling.test.ts',
    // The face written back onto the entity — the first draft's bug. Every pickup then alternates
    // once a step, which at 60Hz is a flicker rather than a cycle.
    broke: 'the face written back onto the entity, so the cycle accumulates',
    guard: 'never accumulates',
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.spriteBase = row.sprite;',
      replace: '    item.kind = face;\n    item.spriteBase = row.sprite;',
    },
  },
  {
    decision: '0052',
    suite: 'tests/cycling.test.ts',
    // Only `sprite` set, not `spriteBase`. The face lasts exactly one step and then `stepEntities`
    // derives it back — a flicker that no screenshot can show.
    broke: 'the drawn face left for stepEntities to overwrite on the next step',
    guard: 'draws the face it will hand over, on every step of both phases',
    edit: {
      path: 'src/app/frame.ts',
      find: '    item.spriteBase = row.sprite;\n    item.spriteHit = row.spriteHit;\n    item.sprite = row.sprite;',
      replace: '    item.sprite = row.sprite;',
    },
  },
  {
    decision: '0052',
    suite: 'tests/cycling.test.ts',
    // The phase on a step counter instead of on the camera. Indistinguishable while the world is
    // scrolling at a constant rate, which is every frame of the game as it currently ships.
    broke: 'the phase read from a step counter rather than from the camera',
    guard: 'flips on a distance, not on a clock',
    edit: {
      path: 'src/content/pickups.ts',
      find: '  return Math.floor(cameraAlong / CYCLE_UNITS) % 2 === 0 ? kind : CYCLE[kind];',
      replace: '  return cameraAlong >= 0 ? kind : CYCLE[kind];',
    },
  },
  {
    decision: '0052',
    suite: 'tests/cycling.test.ts',
    // A pair broken into a one-way mapping. Two of the six pickups then cycle into a face that does
    // not cycle back, so the field drifts towards one half of the table.
    broke: 'the pairing made one-way, so a face has no way back',
    guard: 'pairs every kind with exactly one other',
    edit: {
      path: 'src/content/pickups.ts',
      find: "  missileRate: 'rapid',",
      replace: "  missileRate: 'spread',",
    },
  },
  {
    decision: '0052',
    suite: 'tests/cycling.test.ts',
    // Each pickup given its own phase. Every assertion about a single pickup still passes; the field
    // stops flipping together, which is the whole of what makes it read as deliberate.
    broke: 'each pickup flipping on its own phase rather than with the field',
    guard: 'flips everything on the field on the same step',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const face = w.pickupFlipped ? (w.pickupCycle[item.kind] ?? item.kind) : item.kind;',
      replace:
        '    const face =\n      Math.floor((w.cameraAlong + item.across) / CYCLE_UNITS) % 2 !== 0\n        ? (w.pickupCycle[item.kind] ?? item.kind)\n        : item.kind;',
    },
  },
];
