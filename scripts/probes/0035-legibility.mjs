// The breaks behind docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md.
//
// ⚠️ The first two are the SHIPPED BUG, restored. A build with the first probe applied is exactly
// what was played, and the verdict on it was "I legit thought it was a bug that bullets hit an enemy
// and the enemy didn't get destroyed." Everything in the suite was green on that build: the model
// was right, the collision was right, and a true event had no representation.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    broke: 'the flash never set on a survivor, which is the shipped bug exactly',
    guard: 'THE ONE: a survivor is drawn differently on the step it is hit',
    edit: {
      path: 'src/sim/collide.ts',
      // The `shots` release above it is what keeps this unique — `blastInto` ends the same way.
      find: '      shots.releaseAt(s);\n      if (target.health <= 0) {\n        killed(targets, t, deaths);\n        destroyed++;\n        break;\n      }',
      replace: '      shots.releaseAt(s);\n      if (target.health <= 0) {\n        killed(targets, t, deaths);\n        destroyed++;\n        break;\n      }\n      continue;',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    broke: 'the flash never cleared, so a hit enemy changes colour permanently instead of flashing',
    guard: 'goes back to itself afterwards, so the flash is an event and not a state',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    if (e.flashFor > 0) e.flashFor--;',
      replace: '    if (e.flashFor > 0) e.flashFor = e.flashFor;',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    // The counter can be perfect and still reach nothing the player sees. This is the half that
    // proves the DERIVATION runs, rather than that the bookkeeping does.
    broke: 'the sprite selection dropped, so the counter runs and nothing is drawn from it',
    guard: 'THE ONE: a survivor is drawn differently on the step it is hit',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    e.sprite = e.flashFor > 0 || blinking ? e.spriteHit : e.spriteBase;',
      replace: '    e.sprite = e.spriteBase;',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    broke: 'both enemy kinds pointed back at one sprite, which is what shipped',
    guard: 'no two enemy kinds share a sprite',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    sprite: SPRITE.lancer,\n    spriteHit: SPRITE.lancerHit,',
      replace: '    sprite: SPRITE.drifter,\n    spriteHit: SPRITE.lancerHit,',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    // ⚠️ A `Record<Kind, Row>` forces the field to EXIST and cannot force it to be filled in with
    // anything useful. `spriteHit: SPRITE.drifter` on the drifter compiles, satisfies the table, and
    // draws precisely nothing when the thing is hit.
    broke: "a hit sprite set to the body's ordinary one, which passes a `Record` and shows nothing",
    guard: 'every enemy kind has a hit sprite that is not its ordinary one',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    sprite: SPRITE.drifter,\n    spriteHit: SPRITE.drifterHit,',
      replace: '    sprite: SPRITE.drifter,\n    spriteHit: SPRITE.drifter,',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    // ⚠️ THE PLAY-TEST REVERSAL. This break IS the version that shipped and was rejected: one solid
    // flash lasting the whole invulnerable window, in place of a pulse.
    broke: 'the recovery blink folded into the impact flash, so a state is shown as one long colour change',
    guard: 'an impact and a recovery are two signals, and the second one pulses',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    const blinking = e.invulnFor > 0 && (e.invulnFor & BLINK_PHASE) !== 0;',
      replace: '    const blinking = e.invulnFor > 0;',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    broke: 'the tougher enemy drawn at the same size as the harmless one, which is what shipped',
    guard: 'the enemy that takes more killing is drawn bigger',
    edit: {
      path: 'src/content/sprites.ts',
      find: '  lancer: 7,\n  lancerHit: 7,',
      replace: '  lancer: 5.5,\n  lancerHit: 5.5,',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    // ⚠️ THE MEASURED ONE. Eight steps is what shipped, and at the real fire rate the second hit
    // lands 6–7 steps after the first — inside the flash, drawing nothing of its own. One hit and
    // two hits produced the same picture, which is why the hit count looked random.
    broke: 'the impact flash lasting longer than the gap between connecting shots, so two hits look like one',
    guard: 'a hit finishes flashing before the next one lands',
    edit: {
      path: 'src/app/frame.ts',
      find: 'const IMPACT_FLASH_STEPS = 4;',
      replace: 'const IMPACT_FLASH_STEPS = 8;',
    },
  },
  {
    decision: '0035',
    suite: 'tests/combat.test.ts',
    broke: 'the flash gating damage, so a shot arriving while a target is lit is silently thrown away',
    guard: 'THE CLAIM: a shot that lands while the target is flashing still counts',
    edit: {
      path: 'src/sim/collide.ts',
      find: '      if (!overlaps(shot, target, targetRadiusScale)) continue;',
      replace: '      if (!overlaps(shot, target, targetRadiusScale) || target.flashFor > 0) continue;',
    },
  },
  {
    decision: '0035',
    suite: 'tests/legibility.test.ts',
    /*
      ⚠️ **THE SHIPPED BUG, RESTORED — reported 2026-08-10 as *"bosses 3+ don't show any hit
      interaction at all"*, and it was five of the seven.** The entry above proves a row cannot name
      its ordinary sprite as its hurt one; this proves the other way a hurt sprite reaches nothing —
      a DIFFERENT sprite that bakes identically, because `drawKind` shares one `case` arm between a
      boss and its hurt version and the ink was the only remaining channel.

      ⚠️ **Every guard in the repository was green on the build this reproduces**, including the
      enemy-kind one above: it walks `ENEMIES` and there is no boss in it.
    */
    broke: "the five later bosses' hurt sprites back in the enemy ink, which is exactly what shipped",
    guard: 'THE REPORTED ONE: no body flashes into a bitmap identical to itself',
    edit: {
      path: 'src/render/bake.ts',
      find: "  boss3Hit: 'impact',",
      replace: "  boss3Hit: 'enemy',",
    },
  },
  {
    decision: '0035',
    suite: 'tests/legibility.test.ts',
    // The other half of the pair, so the walk is proved to reach the LAST boss as well as the first
    // of the five. A loop that stops early passes the probe above and ships the bug for boss seven.
    broke: "the last boss's hurt sprite back in the enemy ink",
    guard: 'THE REPORTED ONE: no body flashes into a bitmap identical to itself',
    edit: {
      path: 'src/render/bake.ts',
      find: "  boss7Hit: 'impact',",
      replace: "  boss7Hit: 'enemy',",
    },
  },
  {
    decision: '0035',
    suite: 'tests/palette.test.ts',
    broke: 'impact pointed back at hazard, so a hit and a hazard become one colour',
    guard: 'clears WCAG AA against the background, in every palette',
    edit: {
      path: 'src/content/palette.ts',
      find: "    impact: '#fff4e6',",
      replace: "    impact: '#0b0b16',",
    },
  },
];
