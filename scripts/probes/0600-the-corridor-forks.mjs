// The breaks behind docs/decisions/0600-the-corridor-forks.md.
//
// ⚠️ An island is a wall seen from both sides, so every break here is a place the walls' code was
// right and an island's is not: a stone the model forgets, a way that is not thirty, a body put down
// in the island or let through it, a point read where it has no width, a picture that disagrees.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'the island no stone at all, so the ship flies through it',
    guard: 'THE SHIP: flying into an island costs exactly one hit',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '      return across < (low + high) / 2 ? ISLE_BELOW : ISLE_ABOVE;',
      replace: '      return 0;',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'the island no stone to a shot',
    guard: 'A SHOT ENDS AT THE ISLAND',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '      return across < (low + high) / 2 ? ISLE_BELOW : ISLE_ABOVE;',
      replace: '      return radius > 0 ? (across < (low + high) / 2 ? ISLE_BELOW : ISLE_ABOVE) : 0;',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'nothing holding a body in its way, so one steered at the island bursts on it as on a wall',
    guard: 'A BODY IS HELD IN ITS WAY',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (corridor.isles.length > 0) holdInWay(corridor, e);\n',
      replace: '',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'the hold put back on the side the body is on now rather than the side it came from',
    guard: 'A POINT PARTS WHAT FLIES AT IT',
    edit: {
      path: 'src/app/frame.ts',
      find: '  e.across = outOfStone(corridor, e.along, e.across, e.radius, way);',
      replace: '  e.across = outOfStone(corridor, e.along, e.across, e.radius, way === ISLE_BELOW ? ISLE_ABOVE : ISLE_BELOW);',
    },
  },
  {
    decision: '0600',
    suite: 'tests/corridor.test.ts',
    // The point read nearest the hull's centre, where it has no width: a hull over the tip reads
    // clear while its rim lies on the stone a unit back — every sighting the first flight made.
    broke: 'the island read nearest the hull’s centre rather than at its widest under the hull',
    guard: 'THE REPORTED RISK, IN PIXELS, ON EVERY TIER',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '    const p = Math.max(a, Math.min(b, along - radius));\n    const q = Math.max(a, Math.min(b, along + radius));\n    const low = Math.min(',
      replace: '    const p = Math.max(a, Math.min(b, along));\n    const q = p;\n    const low = Math.min(',
    },
  },
  {
    decision: '0600',
    suite: 'tests/corridor.test.ts',
    broke: 'the island laid without the player’s thirty a way, so it grows until the ways are squeezes',
    guard: 'THE PLAYER’S NUMBER, PER TIER: every way round every island is at least thirty',
    edit: {
      path: 'src/sim/corridor.ts',
      find: 'Math.min(nose * (k - first), nose * (last - k), middle - near - way, far - middle - way)',
      replace: 'Math.min(nose * (k - first), nose * (last - k))',
    },
  },
  {
    decision: '0600',
    suite: 'tests/corridor.test.ts',
    // An island laid off its middle where the corridor is still opening: drawn by a point's tile, wrong.
    broke: 'the first fork authored where the corridor is still pinched, so its island is laid off its middle',
    guard: 'AND EVERY TILE OF AN ISLAND IS ONE THE PAINTER CAN DRAW',
    edit: {
      path: 'src/content/levels.ts',
      find: '        { at: 696, length: 240 },',
      replace: '        { at: 540, length: 240 },',
    },
  },
  {
    decision: '0600',
    suite: 'tests/corridor.test.ts',
    broke: 'the island’s point drawn pointing the same way at both ends',
    guard: 'THE REPORTED RISK, IN PIXELS, ON EVERY TIER',
    edit: {
      path: 'src/render/scene.ts',
      find: 'view.scale, wa < wb ? 0 : Math.PI);',
      replace: 'view.scale, 0);',
    },
  },
  {
    decision: '0600',
    suite: 'tests/corridor.test.ts',
    broke: 'an island’s caps put on the walls’ faces',
    guard: 'AND THE PAINTER PUTS THE STONE WHERE THE MODEL SAYS',
    edit: {
      path: 'src/render/scene.ts',
      find: '  const low = (la + lb) / 2;\n  const high = (ha + hb) / 2;',
      replace: '  const low = (la + lb) / 2 - 1;\n  const high = (ha + hb) / 2 + 1;',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a wave read into the corridor as if it never forked, so a line across the middle is piled on the island’s faces',
    guard: 'A WAVE PARTS ROUND THE ISLAND',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '  if (corridor.isles.length > 0 && !Number.isNaN(isleFace(corridor, along, ISLE_BELOW))) {',
      replace: '  if (corridor.isles.length < 0 && !Number.isNaN(isleFace(corridor, along, ISLE_BELOW))) {',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a flanker aimed by its lane at the far way, across the island',
    guard: 'A FLANKER COMES INTO THE WAY BESIDE ITS OWN WALL',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const way = flanking ? side : 0;',
      replace: '    const way = flanking ? 0 : 0;',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a drifter turning at the walls only, so it presses on the island until the hold slides it',
    guard: 'A DRIFTER TURNS AT THE ISLAND',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const low = Math.max(wayAt(corridor, e.along, e.across, e.radius, -1), ROAM_MIN);\n        const high = Math.min(wayAt(corridor, e.along, e.across, e.radius, 1), ROAM_MAX);',
      replace: '        const low = Math.max(bandAt(corridor, e.along, e.radius, -1), ROAM_MIN);\n        const high = Math.min(bandAt(corridor, e.along, e.radius, 1), ROAM_MAX);',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a weave beside an island squeezed to the corridor rather than its way',
    guard: 'A WEAVE SWINGS ACROSS ITS WAY',
    edit: {
      path: 'src/app/frame.ts',
      find: 'squeezeAt(w.corridor, e.along, e.radius, e.across);',
      replace: 'squeezeAt(w.corridor, e.along, e.radius);',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a rift that carves the walls and leaves the island',
    guard: 'A RIFT CARVES AN ISLAND AS IT CARVES A WALL',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const last = corridor.isles.length > 0 ? CARVE_ISLE : 1;',
      replace: '  const last = 1;',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a carved island still drawn',
    guard: 'A RIFT CARVES AN ISLAND AS IT CARVES A WALL',
    edit: {
      path: 'src/render/scene.ts',
      find: '  if (opened(corridor.passages, start, start + extent, ISLE_CARVE)) return;\n',
      replace: '',
    },
  },
  {
    decision: '0600',
    suite: 'tests/fork.test.ts',
    broke: 'a blast that reaches across an island, as if the line of sight asked only the walls',
    guard: 'AN ISLAND IS COVER',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '    if (stoneAt(corridor, along1 + (along2 - along1) * t, across1 + (across2 - across1) * t, 0) !== 0) return false;',
      replace: '    const hit = stoneAt(corridor, along1 + (along2 - along1) * t, across1 + (across2 - across1) * t, 0);\n    if (hit === 1 || hit === -1) return false;',
    },
  },
];
