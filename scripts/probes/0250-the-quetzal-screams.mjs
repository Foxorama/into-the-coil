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
      // Re-anchored by 0452, whose roots are points turned with the hull.
      find: '        reset(bolt, end, muzzleAcross + turnedAcross(place[0], place[1], boss.turn), bullet, BEAM_BOLT_KIND);',
      replace: '        reset(bolt, end, muzzleAcross + 0 * turnedAcross(place[0], place[1], boss.turn), bullet, BEAM_BOLT_KIND);',
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
      // Re-anchored by 0388, which gave the mouth its zigzag, 0452, which put its root in the throat, and
      // 0453, which gave it a path of its own.
      find: "attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 6, from: [THROAT], jag: QUETZAL_ONE } },",
      replace: "attack: { kind: 'beam', warning: 0, hold: 30, halfWidth: 6, from: [THROAT], jag: QUETZAL_ONE } },",
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
        draws them. And by 0453, whose beams say their own count of points. And by 0470, whose beam
        blooms as it lights and is stroked as a beam.
      */
      // And by 0545, whose bolt verb takes a tone where it took a flag.
      find: '        surface.bolt(BEAM_PATH, points, e.radius * BEAM_STROKE * beamBloom(e) * view.scale, held, BOLT_HOSTILE, true);',
      replace: '        surface.bolt(BEAM_PATH, points, BOLT_WIDTH * view.scale, held, BOLT_HOSTILE, true);',
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
      // Re-anchored by 0453, whose path is `beamShift`: the flicker added on top, from the hash the painter imports.
      find: '        const across = endAcross + beamShift(e, i);',
      replace: '        const across = endAcross + beamShift(e, i) + jag(e.spin, i, Math.floor(e.lifeFor / BOLT_PAGE_STEPS)) * e.jag;',
    },
  },
];
