// The breaks behind docs/decisions/0406-a-mid-boss-is-met-armed.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0406',
    suite: 'tests/midboss.test.ts',
    /*
      ⚠️ THE STATE THE REPORT IS ABOUT, from the other side: the healths solved at the loadout the run
      carries in, and the fight measured at one rung of each again, as 0269 measured it. Every mid-boss
      from the second level on is then fought by a ship a third as strong as the one the healths were
      solved for, and the fights run long of their band — the mirror of the six-to-nine-second fights
      a player met while the healths were solved at one rung.
    */
    broke: 'the mid-boss measured at one rung of each again, rather than the loadout the run carries in',
    guard: 'THE REPORTED ONE: a mid-boss fight lasts what its level asks',
    edit: {
      path: 'scripts/weigh-fight.mjs',
      find: '    if (level === kind) return { weaponTier, missileTier };',
      replace: '    if (level === kind) return { weaponTier: 1, missileTier: 1 };',
    },
  },
  {
    decision: '0406',
    suite: 'tests/midboss.test.ts',
    // A clear that carries nothing, which is what 0269's one rung silently assumed.
    broke: 'the loadout forgetting every earlier level, as though a clear reset the ladders',
    guard: 'THE REPORTED ONE: a mid-boss fight lasts what its level asks',
    edit: {
      path: 'scripts/weigh-fight.mjs',
      find: '    for (const p of row.pickups) if (level !== kind || p.at < midAt) take(p.kind);',
      replace: '    for (const p of row.pickups) if (level === kind && p.at < midAt) take(p.kind);',
    },
  },
];
