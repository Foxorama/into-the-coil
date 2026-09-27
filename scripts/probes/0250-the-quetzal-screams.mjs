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
      /*
        Re-anchored by 0388: the quetzal's beams are all jagged, so they are drawn by the jagged branch,
        and the straight one's stroke went STILL GREEN under the proof. The same break, on the line that
        draws them.
      */
      find: '        surface.bolt(BEAM_PATH, BEAM_POINTS, e.radius * BEAM_STROKE * view.scale, held, true);',
      replace: '        surface.bolt(BEAM_PATH, BEAM_POINTS, BOLT_WIDTH * view.scale, held, true);',
    },
  },
  {
    decision: '0250',
    suite: 'tests/quetzal.test.ts',
    /*
      The beam jagged LIKE LIGHTNING — a jag re-rolled every couple of frames, as a bolt flickers.
      ⚠️ **RE-AIMED BY 0388**, which jagged the pterodactyls' beams on purpose, so the old break (any jag
      at all) is now the ask. What still makes a laser lightning is the flicker: a zigzag that moves
      burns somewhere other than where its warning was drawn, which is the lie 0250 refused.
    */
    broke: 'the beam given the lightning’s flicker, so it burns off the line it warned',
    guard: 'THE PICTURE: the warning is drawn dim',
    edit: {
      path: 'src/render/scene.ts',
      find: '        const across = endAcross + beamOffset(e.spin, e.jag, i);',
      replace: '        const across = endAcross + beamOffset(e.spin + Math.floor(e.lifeFor / BOLT_PAGE_STEPS), e.jag, i);',
    },
  },
];
