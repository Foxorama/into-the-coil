// The jellyfish opens — docs/decisions/0255-the-jellyfish-opens.md
//
// Every guard 0255 adds, broken on purpose. `node scripts/prove-guard.mjs 0255`.

export const PROBES = [
  {
    decision: '0255',
    suite: 'tests/medusa.test.ts',
    // The opened bell taking no more than a closed one: an opening that is a word.
    broke: 'the opened bell taking no more damage than a closed one, so the opening is a word',
    guard: 'THE OPENING, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: "  return stance.kind === 'bare' || stance.kind === 'open' ? stance.damageScale : 1;",
      replace: "  return stance.kind === 'bare' ? stance.damageScale : 1;",
    },
  },
  {
    decision: '0255',
    suite: 'tests/medusa.test.ts',
    // The opened bell silenced like a bared one: the heart spews nothing.
    broke: 'the opened bell silenced as a bared one is, so the heart spews nothing',
    guard: 'THE OPENING, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      find: "  if (phase.stance.kind === 'bare') return direction;",
      replace: "  if (phase.stance.kind !== 'volley') return direction;",
    },
  },
  {
    decision: '0255',
    suite: 'tests/medusa.test.ts',
    // The fall's health gate dropped: moon jellies fall on a whole bell.
    broke: 'the fall’s health gate dropped, so the moon jellies fall on a whole bell',
    guard: 'THE MOON JELLIES, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (fall !== null && boss.health <= fall.from * w.bossFullHealth) {',
      replace: '  if (fall !== null) {',
    },
  },
  {
    decision: '0255',
    suite: 'tests/medusa.test.ts',
    // A fallen body not steering for the bottom edge: it sits on the top edge and drifts.
    broke: 'a fallen body not steering for the bottom edge, so it sits on the top edge and drifts',
    guard: 'THE MOON JELLIES, DRIVEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '    e.velAcross = row.closing;\n    e.steerAcross = ACROSS_CULL_MAX + row.radius;\n',
      replace: '',
    },
  },
  {
    decision: '0255',
    suite: 'tests/medusa.test.ts',
    // The moon jelly given a gun: a rain that shoots is a wall.
    broke: 'the moon jelly given a gun, so the rain is a wall of bullets',
    guard: 'THE MOON JELLY: a body with a bell',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    closing: 0.1,\n    fireEvery: 0,\n    shot: 'spit',",
      replace: "    closing: 0.1,\n    fireEvery: 60,\n    shot: 'spit',",
    },
  },
  {
    decision: '0255',
    suite: 'tests/medusa.test.ts',
    // The tendrils all hung from the middle of the bell: one beam wearing five names.
    broke: 'the tendrils all hung from the middle of the bell, so five beams are one',
    guard: 'THE FIVE PHASES: a ring, the tendrils',
    edit: {
      path: 'src/content/bosses.ts',
      find: "attack: { kind: 'beam', warning: 12, hold: 12, halfWidth: 1.2, from: [-12, -6, 0, 6, 12] } },",
      replace: "attack: { kind: 'beam', warning: 12, hold: 12, halfWidth: 1.2, from: [0, 0, 0, 0, 0] } },",
    },
  },
];
