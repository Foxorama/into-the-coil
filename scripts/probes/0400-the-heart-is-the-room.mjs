// The heart is the room — docs/decisions/0400-the-heart-is-the-room.md
//
// Every guard 0400 adds, broken on purpose. `node scripts/prove-guard.mjs 0400`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0400',
    suite: 'tests/medusa.test.ts',
    // The fight scrolling on through the jellyfish, as it did before.
    broke: 'the room taken off the jellyfish’s row',
    guard: 'THE ASK: the fight stops the screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    room: { stand: 60, settle: 150, mouth: 40, wall: null, opens: 0 },',
      replace: '    room: null,',
    },
  },
  {
    decision: '0400',
    suite: 'tests/medusa.test.ts',
    // A heart that is a housing: set into the place and never beating.
    broke: 'the heart it is set over not told to beat',
    guard: 'THE ASK: the fight stops the screen',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    move: { kind: 'socket', at: ACROSS_SPAN / 2, seat: SPRITE.heart, throb: 0.07 },",
      replace: "    move: { kind: 'socket', at: ACROSS_SPAN / 2, seat: SPRITE.heart },",
    },
  },
  {
    decision: '0400',
    suite: 'tests/medusa.test.ts',
    // The heart back in the level's background, going past a long way off before the fight.
    broke: 'the heart landmark put back into the level',
    guard: 'and the heart is not in the level',
    edit: {
      path: 'src/content/levels.ts',
      find: "    landmarks: [],\n    theme: 'core',",
      replace: "    landmarks: [{ at: 2070, lane: 46, depth: 0.07, beat: 96, variant: 0 }],\n    theme: 'core',",
    },
  },
  {
    decision: '0400',
    suite: 'tests/heart.test.ts',
    // A vessel's trunk read as though the weather did not move, which is where it floats off its trunk.
    broke: 'the trunk a vessel leaves read without the weather’s parallax',
    guard: '0400 — IN LANE UNITS: each vessel into the heart leaves a trunk where the trunk is drawn',
    edit: {
      path: 'src/content/veins.ts',
      find: '  const offset = (((cameraAlong * WEATHER_DEPTH) % span) + span) % span;',
      replace: '  const offset = 0;',
    },
  },
  {
    decision: '0400',
    suite: 'tests/heart.test.ts',
    // The painter handed a heart and drawing no vessel into it.
    broke: 'no vessel drawn into a heart that is on the field',
    guard: 'and they are drawn only where a fight has a heart',
    edit: {
      path: 'src/render/scene.ts',
      find: '  if (heart === null) return;',
      replace: '  if (heart === null || heart.length > 0) return;',
    },
  },
];
