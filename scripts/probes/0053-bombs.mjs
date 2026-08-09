// The breaks behind docs/decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md.
//
// ⚠️ The blast is the first body in the game that hurts BOTH sides, and half of these probes exist
// because every reasonable instinct removes that. The other half are the arsenal's arithmetic, which
// is invisible until a player counts their own bombs and finds one missing.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    /*
      ⚠️ THE ONE THE WHOLE THING IS ABOUT: *"and the blast hurts the player, which is the skill in
      it."* Every other collision in the game is a threat meeting the ship, so a pairing that hurts
      the player with their own weapon is the line somebody deletes while tidying — and the game is
      still perfectly playable afterwards, just without the thing that made the bomb a decision.
    */
    broke: 'the blast made harmless to the player, so a bomb is free',
    guard: 'hurts the player, and costs exactly what any other hit costs',
    edit: {
      path: 'src/app/frame.ts',
      find:
        '    collideIntoOne(w.blasts, w.ship, w.tuning.hurtbox, w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS, false);',
      replace: '    void w.blasts;',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // The blast left dangerous for its whole life. Every body inside it is billed once a step, so a
    // bomb does ten times what its row says — and only on the frames the screen is fullest.
    broke: 'the blast left armed after it landed, so it bills everything inside it once a step',
    guard: 'bills nothing twice',
    edit: {
      path: 'src/app/frame.ts',
      find: '    for (let i = w.blasts.size - 1; i >= 0; i--) w.blasts.at(i).damage = 0;',
      replace: '    void w.blasts;',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // A blast that hits one thing and stops, which is what a shot does. It looks like a blast that
    // missed everything except whatever the pool happened to hand back first.
    broke: 'the blast spent on the first body it touches, like a shot',
    guard: 'takes six pulses off everything inside it',
    edit: {
      path: 'src/sim/collide.ts',
      find: '      if (!overlaps(blast, target, 1)) continue;\n      target.health -= blast.damage * damageScale;',
      replace: '      if (!overlaps(blast, target, 1)) continue;\n      target.health -= blast.damage * damageScale;\n      blast.damage = 0;',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // A bomb that goes off on contact — a missile with a bigger number. Choosing the PLACE is the
    // whole of what makes it a skill, and this quietly takes that away.
    broke: 'the bomb put into a collision pairing, so it is eaten before it can go off',
    guard: 'hurts nothing on its way there',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored when the pairings started summing what they destroyed — decision 0072, which
      // needed a survived hit to be tellable from a kill. The break is unchanged: the bomb, added to
      // a pairing it must never be in.
      find: '    killedByShots += collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);',
      replace:
        '    killedByShots += collideInto(w.missiles, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);\n' +
        '    killedByShots += collideInto(w.bombs, w.enemies, 1, 1, IMPACT_FLASH_STEPS, w.deaths);',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // The fuse taken from a number rather than from the reach, so the two disagree the first time
    // either is tuned — and the bomb goes off somewhere nobody authored.
    broke: 'the fuse fixed rather than derived from the reach the row states',
    guard: 'travels ahead of the ship and detonates about a reach away',
    edit: {
      path: 'src/app/frame.ts',
      find: '  thrown.lifeFor = Math.max(1, Math.round(row.reach / body.speed));',
      replace: '  thrown.lifeFor = 20;',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // The blast drawn at a different size from the one it damages at — the mistake the picture caught
    // once already, in the other direction.
    broke: 'the blast drawn at a size that is not the reach of its damage',
    guard: 'leaves a blast drawn at exactly the radius that does the damage',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  blast: 68,',
      replace: '  blast: 48,',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // A death handing the arsenal back empty, which is what 0039 said before there was a starting
    // special to go back to. The player then flies the hardest stretch of the level with no answer.
    //
    // ⚠️ RE-ANCHORED by `docs/decisions/0085-a-death-does-not-cost-the-bombs.md`, which changed what
    // the line says and not what this probe is about: a death must not leave the player holding
    // nothing. The break is the same edit against the new right-hand side.
    broke: 'a death emptying the arsenal instead of leaving the player what they were carrying',
    guard: 'a death costs no charges at all, and a continue costs the banked ones',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '            arsenal: state.arsenal,\n            upgrades: [],',
      replace: '            arsenal: [],\n            upgrades: [],',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // An emptied weapon dropped from the list. Every trigger below it shifts up, so spending the last
    // bomb silently rebinds the player's buttons.
    broke: 'an empty special dropped from the arsenal, so the triggers below it move',
    guard: 'spends one charge per press, and stops at empty',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      if (entry === undefined || entry.charges <= 0) return state;',
      replace:
        '      if (entry === undefined || entry.charges <= 0) return state;\n      if (entry.charges === 1) {\n        return {\n          lives: state.lives,\n          level: state.level,\n          arsenal: state.arsenal.filter((_, i) => i !== action.slot),\n          upgrades: state.upgrades,\n          difficulty: state.difficulty,\n        };\n      }',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // A press latched rather than counted. On a slow frame the extra presses are dropped, so the
    // arsenal is lossy exactly when the game is already struggling.
    broke: 'presses latched to one a step rather than counted',
    guard: 'reports every press in a step',
    edit: {
      path: 'src/app/frame.ts',
      find: '    for (let press = w.intent.specials[slot] ?? 0; press > 0; press--) w.onSpecial(slot);',
      replace: '    if ((w.intent.specials[slot] ?? 0) > 0) w.onSpecial(slot);',
    },
  },
  {
    decision: '0053',
    suite: 'tests/bombs.test.ts',
    // A level clear paying only the bomb. It reads as correct today, because the bomb is the only
    // special anybody owns — and the second one arrives owning nothing.
    broke: 'a level clear paying one named special rather than the arsenal',
    guard: 'gains one per level cleared, for every special owned',
    edit: {
      path: 'src/state/slices/run.ts',
      find: "        arsenal: state.arsenal.map((entry) => ({ kind: entry.kind, charges: entry.charges + 1 })),",
      replace:
        "        arsenal: state.arsenal.map((entry) => ({ kind: entry.kind, charges: entry.kind === 'mines' ? entry.charges + 1 : entry.charges })),",
    },
  },
  {
    decision: '0053',
    suite: 'tests/hud.browser.test.ts',
    /*
      ⚠️ THE BUG THE BOMB MADE VISIBLE, kept broken on purpose. `dispatch` compared `next.run` to
      `state.run` after `state` had already been reassigned to `next` — a thing compared to itself —
      so the readout only ever refreshed when the SCREEN moved. It looked fine because both things it
      showed happened to change at a screen boundary.
    */
    broke: 'the readout refreshed only when the screen changes, so a spent charge never shows',
    guard: 'follows a spent charge, which changes no screen at all',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (runChanged || moved) syncHud();',
      replace: '    if (moved) syncHud();',
    },
  },
];
