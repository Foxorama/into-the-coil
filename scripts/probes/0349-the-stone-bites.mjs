// The breaks behind docs/decisions/0349-the-stone-bites.md.
//
// Asked for: *"a wall will kill the ship and block shots, waves need to spawn in the corridors and also
// explode if they hit a wall."* Answered on the plan: one hit and pushed out, a wall kill is not the
// player's, and nothing reaches through stone — a blast included.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    broke: 'the wall made harmless, so flying into stone costs nothing',
    guard: 'THE SHIP, IN LANE UNITS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  wound(ship, w.tuning.terrainDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);',
      replace: '  void wound;',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    // The ship left where it went in: hurt once, then blinking inside the wall for the whole window.
    broke: 'the ship not put back out, so it sits in the stone while it blinks',
    guard: 'THE SHIP, IN LANE UNITS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  ship.across = faceAt(corridor, ship.along, side) - side * reach;',
      replace: '',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    /*
      Both lines: the first version changed only the wound, and `solid` returns on the line before it,
      so the break never ran and the guard stayed green over nothing.
    */
    broke: 'the terrain assist ignored, so a player who chose `solid` still pays for the wall',
    guard: 'and at the `solid` assist the wall pushes and costs nothing',
    edit: {
      path: 'src/app/frame.ts',
      find:
        '  if (ship.invulnFor > 0 || w.tuning.terrainDamage <= 0) return;\n' +
        '  wound(ship, w.tuning.terrainDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);',
      replace: '  if (ship.invulnFor > 0) return;\n  wound(ship, 1, INVULN_STEPS, IMPACT_FLASH_STEPS);',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    broke: 'enemy shots left out of the stone, so they fly through walls',
    guard: 'A SHOT ENDS AT THE FACE',
    edit: {
      path: 'src/app/frame.ts',
      find: '  breakInStone(w, corridor, w.enemyShots);',
      replace: '',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    broke: 'a body that meets stone bursts but is not removed, so it flies on through the wall',
    guard: 'A BODY THAT MEETS THE STONE IS DESTROYED',
    edit: {
      path: 'src/app/frame.ts',
      find: "    flare(w, e.along, e.across, 'burst');\n    w.enemies.releaseAt(i);",
      replace: "    flare(w, e.along, e.across, 'burst');",
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    // The obvious way to write it: log the death like any other, which scores it and drops for it.
    broke: 'a wall kill written into the kill log, so the player is paid for what the wall did',
    guard: 'A BODY THAT MEETS THE STONE IS DESTROYED, AND IT IS NOT THE PLAYER’S KILL',
    edit: {
      path: 'src/app/frame.ts',
      find: "    flare(w, e.along, e.across, 'burst');\n    w.enemies.releaseAt(i);",
      replace:
        "    flare(w, e.along, e.across, 'burst');\n" +
        '    w.deaths.along[w.deaths.count] = e.along;\n' +
        '    w.deaths.across[w.deaths.count] = e.across;\n' +
        '    w.deaths.kind[w.deaths.count++] = e.kind;\n' +
        '    w.enemies.releaseAt(i);',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    broke: 'hunters left to follow the ship into the stone, so standing by a wall is a free kill',
    guard: 'a body that steers slides along the face rather than into it',
    edit: {
      path: 'src/app/frame.ts',
      find: "    if ((m.kind === 'hunt' || m.kind === 'circle') && e.steerAcross === 0) keepInside(w.corridor, e);",
      replace: "    if (m.kind === 'circle' && e.steerAcross === 0) keepInside(w.corridor, e);",
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    // The player's own answer, against the plan's recommendation — and the easiest line to drop.
    broke: 'a blast that reaches through stone',
    guard: 'NOTHING REACHES THROUGH STONE',
    edit: {
      path: 'src/sim/collide.ts',
      find: '      if (!clearLine(corridor, blast.along, blast.across, target.along, target.across)) continue;',
      replace: '',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    broke: 'lightning that jumps through stone',
    guard: 'and lightning does not jump through it',
    edit: {
      path: 'src/sim/collide.ts',
      find: '    if (!clearLine(corridor, along, across, target.along, target.across)) continue;',
      replace: '',
    },
  },
  {
    decision: '0349',
    suite: 'tests/stone.test.ts',
    // A line of sight tested only at its ends sees straight through whatever is between them.
    broke: 'the line of sight tested at its ends only, so it never looks at the stone in the middle',
    guard: 'NOTHING REACHES THROUGH STONE',
    edit: {
      path: 'src/sim/corridor.ts',
      find: '  const steps = Math.max(1, Math.ceil(length / SIGHT_STEP));',
      replace: '  const steps = 1;',
    },
  },
];
