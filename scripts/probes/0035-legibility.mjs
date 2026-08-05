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
      find: '      target.flashFor = flashSteps;\n    }\n  }\n  return destroyed;',
      replace: '    }\n  }\n  return destroyed;',
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
