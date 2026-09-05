// The serpent strikes — docs/decisions/0248-the-serpent-strikes.md
//
// Every guard 0248 adds, broken on purpose. `node scripts/prove-guard.mjs 0248`.

export const PROBES = [
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // A phase's shot ignored: the serpent throws acid all the way down.
    broke: 'the phase’s shot ignored, so the serpent throws acid in every phase',
    guard: 'THE THREE WEAPONS: acid while whole',
    edit: {
      path: 'src/app/frame.ts',
      find: '    SHOTS[throwing.shot ?? w.bossRow.shot],',
      replace: '    SHOTS[w.bossRow.shot + (throwing.shot === null ? \'\' : \'\')],',
    },
  },
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // The void blast inked as the enemy's bullet.
    broke: 'the void blast drawn in the enemy’s bullet ink',
    guard: 'THE ACID AND THE VOID: two shots of their own',
    edit: {
      path: 'src/render/bake.ts',
      find: "  acid: 'acid',\n  void: 'void',",
      replace: "  acid: 'acid',\n  void: 'enemy',",
    },
  },
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // No warning: the line is lightning the step it is drawn.
    broke: 'the warning authored to nothing, so the lightning lands the step its line appears',
    guard: 'THE RAIN: a volley draws its warning lines first',
    edit: {
      path: 'src/content/bosses.ts',
      find: "attack: { kind: 'rain', warning: 45, halfWidth: 4 } },",
      replace: "attack: { kind: 'rain', warning: 0, halfWidth: 4 } },",
    },
  },
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // The strike never hurting: a light show.
    broke: 'the strike landing on nobody, so the lightning is a light show',
    guard: 'THE RAIN: a volley draws its warning lines first',
    edit: {
      path: 'src/app/frame.ts',
      find: '    wound(w.ship, b.damage * w.tuning.playerDamage, INVULN_STEPS, IMPACT_FLASH_STEPS);\n',
      replace: '    void b;\n',
    },
  },
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // The columns falling anywhere on the lane, including where the ship cannot be.
    broke: 'the columns falling a whole view up the lane, beyond the box the ship can reach',
    guard: 'THE RAIN: a volley draws its warning lines first',
    edit: {
      path: 'src/app/boss.ts',
      find: '        const along = cameraAlong + rainRng.range(PLAYER_ALONG_MARGIN, PLAYER_LEAD);',
      replace: '        const along = cameraAlong + PLAYER_LEAD + rainRng.range(PLAYER_ALONG_MARGIN, PLAYER_LEAD);',
    },
  },
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // The strike a column wide across the whole lane along: a ship anywhere is hit.
    broke: 'the strike’s half-width the whole view, so a ship anywhere along the lane is hit',
    guard: 'and a ship elsewhere on the lane is not touched',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (Math.abs(w.ship.along - b.along) > b.radius + w.ship.radius * w.tuning.hurtbox) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0248',
    suite: 'tests/serpent.test.ts',
    // The lightning stroked in the player's hand, as every bolt was before 0248.
    broke: 'the serpent’s lightning stroked in the player’s own bolt inks',
    guard: 'THE PICTURE: the warning is drawn dim',
    // Re-anchored by 0250, which put the beam beside the rain on this line.
    edit: {
      path: 'src/render/scene.ts',
      find: '    const hostile = e.kind === RAIN_BOLT_KIND || beam;',
      replace: '    const hostile = (e.kind === RAIN_BOLT_KIND || beam) && false;',
    },
  },
];
