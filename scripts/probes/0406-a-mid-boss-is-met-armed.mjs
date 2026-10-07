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
      // ⚠️ Re-anchored by 0441: the gun is whole from the first second, so the tubes are all a run
      // carries in that a level can change.
      // And by 0575, which counts a level's place as a third of a tube.
      find: '    if (level === kind) return { missileTier: Math.min(UPGRADE_TIERS, Math.floor(thirds / shares)) };',
      replace: '    if (level === kind) return { missileTier: 1 };',
    },
  },
  /*
    ── *"THE LOADOUT FORGETTING EVERY EARLIER LEVEL"* WAS HERE, AND 0441 TOOK WHAT IT COULD SEE ──────

    It dropped every earlier level's pickups from the walk. While the gun had a ladder that cost a
    mid-boss most of a ship; since 0441 the walk counts the tubes alone, and the mid-boss drops still
    hand one over, so forgetting the earlier levels' authored tubes moves a fight by less than the band
    allows — CI reported STILL GREEN. The probe above, which drops every tube, is the break that still
    shows.
  */
];
