// The quetzal screams — docs/decisions/0250-the-quetzal-screams.md
//
// Every guard 0250 adds, broken on purpose. `node scripts/prove-guard.mjs 0250`.

export const PROBES = [
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // The roots ignored: every beam leaves the hull's centre, so the wings fire from the mouth.
    broke: 'the roots ignored, so every beam leaves the middle of the hull',
    guard: 'THE WINGS AND THE MOUTH, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      // From the muzzle since 0384, which is the hull's centre for every boss but a many-headed one.
      find: '        reset(bolt, end, muzzleAcross + attack.from[i]!, bullet, BEAM_BOLT_KIND);',
      replace: '        reset(bolt, end, muzzleAcross + 0 * attack.from[i]!, bullet, BEAM_BOLT_KIND);',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // No warning: the beam is on the step its line appears.
    broke: 'the mouth’s warning authored to nothing, so the beam is on the step its line appears',
    guard: 'THE WARNING AND THE HOLD',
    edit: {
      path: 'src/content/bosses.ts',
      // Re-anchored by 0388, which gave the mouth its zigzag.
      find: "attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 6, from: [0], jag: 18 } },",
      replace: "attack: { kind: 'beam', warning: 0, hold: 30, halfWidth: 6, from: [0], jag: 18 } },",
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // The beam hurting on one step only — the serpent's rule, which makes a laser lightning.
    broke: 'the beam hurting only on the step it lights, as the serpent’s lightning does',
    guard: 'THE WARNING AND THE HOLD',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (b.lifeFor > b.holdFor) continue;\n',
      replace: '      if (b.lifeFor !== b.holdFor) continue;\n',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // The beam's half-width the whole lane: a ship anywhere across is hit.
    broke: 'the beam’s half-width ignored, so a ship anywhere across the lane is inside it',
    guard: 'and a ship beside the beam',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0388: the half-width is measured to the zigzag's nearest leg now, and is the same line.
      find: '      if (beamDistance(b, w.ship.along, w.ship.across) > b.radius + w.ship.radius * w.tuning.hurtbox) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // No brace: the hull patrols away from its own lasers.
    broke: 'the brace removed, so the hull flies away from its own beams',
    guard: 'THE BRACE: the hull stands still',
    edit: {
      path: 'src/app/boss.ts',
      find: '  if (boss.holdFor > 0) {\n    boss.velAcross = 0;\n    boss.holdFor--;\n  }',
      replace: '  if (boss.holdFor > 0) {\n    boss.holdFor--;\n  }',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // The flight not added to the cadence: the mouth's beam outlasts its phase's fireEvery and the hull never moves again.
    broke: 'the flight between beams not added to the cadence, so the hull braces for ever',
    guard: 'THE BRACE: the hull stands still',
    edit: {
      path: 'src/app/boss.ts',
      find: '      boss.holdFor = held;\n      boss.fireIn += held;',
      replace: '      boss.holdFor = held;',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // The beam drawn at a bolt's width, whatever it hurts: a thin line the player may not stand beside.
    broke: 'the beam drawn at the arc’s own width, narrower than it hurts',
    guard: 'THE PICTURE: the warning is drawn dim',
    edit: {
      path: 'src/render/scene.ts',
      find: '      surface.bolt(LINK, BOLT_VERTICES, e.radius * BEAM_STROKE * view.scale, held, true);',
      replace: '      surface.bolt(LINK, BOLT_VERTICES, BOLT_WIDTH * view.scale, held, true);',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    // The beam jagged like lightning.
    broke: 'the beam given the lightning’s jag',
    guard: 'THE PICTURE: the warning is drawn dim',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const amp = warning || beam ? 0 : BOLT_JAG * length > BOLT_JAG_MAX ? BOLT_JAG_MAX : BOLT_JAG * length;',
      replace: '    const amp = warning ? 0 : BOLT_JAG * length > BOLT_JAG_MAX ? BOLT_JAG_MAX : BOLT_JAG * length;',
    },
  },
];
