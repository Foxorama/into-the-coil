// The breaks behind
// docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md.
//
// ⚠️ The first three restore code that SHIPPED and that every guard in the repository was green for.
// `SHOTS.spit` named `SPRITE.bullet`, so the thing that kills the player and the thing they kill with
// were one bitmap, one ink and one size — for as long as there have been enemies that shoot.
//
// ⚠️ The load-bearing assertion is in PIXELS of the screen the report was made on, because
// *"essentially the same size"* is a claim about the glass.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    // ⚠️ THE REPORTED ONE, restored exactly: the enemy's shot wearing the player's bitmap.
    broke: 'what shoots back given the player’s own silhouette again, which is what shipped',
    guard: 'THE REPORTED ONE: they differ in shape, in size and in ink',
    edit: {
      path: 'src/content/shots.ts',
      find: "  spit: { sprite: SPRITE.spit, spriteHit: SPRITE.spit, radius: 0.9, health: 1, damage: 1, speed: 1.4 },",
      replace: "  spit: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 1.4 },",
    },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE HALF-FIX, and it is the one a hand would write: a shape of its own, drawn in the ink that
      used to mean *a shot, whoever fired it*. The silhouettes differ and the player still has no
      colour rule — *pink will hurt you* stops being true the moment one threat is orange.
    */
    broke: 'the enemy’s shot left in the bullet ink, so colour still says nothing about sides',
    guard: 'and the ship’s own fire is never in the ink of the things trying to kill it',
    edit: { path: 'src/render/bake.ts', find: '  spit: \'enemy\',', replace: '  spit: \'bullet\',' },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE SIZE CHANNEL ALONE, taken back. At the pulse's own extent the two differ by shape and ink
      and by nothing a player reads at a glance in a screen full of both — which is the report's own
      *"essentially the same size"*, and it is the assertion written in pixels.
    */
    broke: 'the enemy’s shot drawn at the pulse’s size, so only shape and ink separate them',
    guard: 'THE REPORTED ONE: they differ in shape, in size and in ink',
    edit: { path: 'src/content/sprites.ts', find: '  spit: 2.6,', replace: '  spit: 1.8,' },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE GENERAL RULE, and it is the one whose absence let the defect live. Two shot kinds sharing
      a bitmap is a structural fact a table can state; *these two happen to differ today* is not.
      `src/content/pickups.ts` has held the same rule over pickups since 0041.
    */
    broke: 'two shots given one silhouette, which is the shape of the defect rather than the defect',
    guard: 'no two shots in the game share a silhouette at all',
    edit: {
      path: 'src/content/shots.ts',
      find: '  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 3, speed: 1.5 },',
      replace: '  missile: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 1.3, health: 1, damage: 3, speed: 1.5 },',
    },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE SECOND REPORTED ONE, restored: one hull for every loadout. It is what shipped, and
      `docs/game.md` has said *"every upgrade changes how the ship looks on screen"* the whole time.
    */
    broke: 'the hull ladder collapsed to one, so an upgrade never shows on the ship',
    guard: 'THE REPORTED ONE: a hull that has taken upgrades is not the hull that has not',
    edit: {
      path: 'src/content/ships.ts',
      find: '  { base: SPRITE.shipMk2, hit: SPRITE.shipMk2Hit },',
      replace: '  { base: SPRITE.ship, hit: SPRITE.shipHit },',
    },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE TIER RESOLVED AND NEVER WORN, which is the failure a table-only guard cannot see. Every
      number is right, `weaponFor` carries the tier, and the painter blits the bare hull for ever.
    */
    broke: 'the hull never applied, so the tier is resolved and nothing draws it',
    guard: 'is the hull the painter actually blits, and a death puts it back',
    /*
      ⚠️ **The WHOLE body, and the first attempt broke two of its three lines and came back STILL
      GREEN.** `wearHull` writes `spriteBase`, `spriteHit` and `sprite` — the third because the frame
      drawn before the next step reads it — so a break that left the third in place still painted the
      new hull. That is a probe modelling a mistake nobody would make; the mistake that matters is the
      resolved tier never reaching the ship at all.
    */
    edit: {
      path: 'src/app/frame.ts',
      find:
        '  const hull = hullFor(w.weapon.tier);\n' +
        '  w.ship.spriteBase = hull.base;\n' +
        '  w.ship.spriteHit = hull.hit;',
      replace: '  const hull = hullFor(0);\n  void hull;',
    },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ THE TIER KEYED TO BARRELS, which is the reading a hand reaches for first — and it tells a
      player who spent every upgrade on missiles that they have upgraded nothing.
    */
    broke: 'the hull keyed to barrels, so a missile loadout is drawn as a bare ship',
    guard: 'climbs with the upgrade list whatever the upgrades were spent on',
    edit: {
      path: 'src/content/pickups.ts',
      find: '    tier: Math.min(MAX_HULL_TIER, Math.floor(upgrades.length / UPGRADES_PER_TIER)),',
      replace: '    tier: Math.min(MAX_HULL_TIER, shots - 1),',
    },
  },
  {
    decision: '0081',
    suite: 'tests/legibility.test.ts',
    // The clamp let off its leash: past the last hull the index is `undefined`, and an undefined
    // sprite is a blit of nothing rather than an error anybody would see.
    broke: 'the hull ladder unclamped, so a long run runs off the end of the hulls there are',
    guard: 'climbs with the upgrade list whatever the upgrades were spent on',
    edit: {
      path: 'src/content/pickups.ts',
      find: '    tier: Math.min(MAX_HULL_TIER, Math.floor(upgrades.length / UPGRADES_PER_TIER)),',
      replace: '    tier: Math.floor(upgrades.length / UPGRADES_PER_TIER),',
    },
  },
];
