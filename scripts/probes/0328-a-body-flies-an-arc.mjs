// A body flies an arc — docs/decisions/0328-a-body-flies-an-arc.md
//
// Every guard 0328 adds or reaches, broken on purpose. `node scripts/prove-guard.mjs 0328`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0328',
    suite: 'tests/swoop.test.ts',
    // The rotation never applied: the arm computes the turn and writes nothing, so a swift flies the
    // straight line its spawner gave it.
    broke: 'the arc’s rotation never written back, so a swift flies straight',
    guard: 'THE PICTURE: from the lead edge it flies straight until it is well into the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '          e.velAlong = along * c - across * s + w.scrollPerStep;\n          e.velAcross = along * s + across * c;\n        }\n        e.turn = turnFor(',
      replace: '          void c;\n          void s;\n        }\n        e.turn = turnFor(',
    },
  },
  {
    decision: '0328',
    suite: 'tests/swoop.test.ts',
    // The on-screen gate removed: a lead swift begins its arc beyond the horizon and has flown half
    // of it before its hull is seen.
    broke: 'the arc begun beyond the view, so half of it is flown unseen',
    guard: 'THE PICTURE: from the lead edge it flies straight until it is well into the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (turned < m.sweep && (turned > 0 || depth >= m.after)) {',
      replace: '        if (turned < m.sweep) {',
    },
  },
  {
    decision: '0328',
    suite: 'tests/swoop.test.ts',
    // The turn begun at the edge rather than `after` units in: the half circle sits against the
    // leading edge, the body comes twenty-five units in, and it is gone in a second and a half.
    broke: 'the arc begun at the leading edge, so the U sits against it and the body barely enters',
    guard: 'THE PICTURE: from the lead edge it flies straight until it is well into the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (turned < m.sweep && (turned > 0 || depth >= m.after)) {',
      replace: '        if (turned < m.sweep && depth >= 0) {',
    },
  },
  {
    decision: '0328',
    suite: 'tests/swoop.test.ts',
    // The sweep ignored: the body keeps turning past its half circle and comes round for another
    // pass, which is the loop's job and not this arm's.
    broke: 'the sweep ignored, so a swift keeps turning past its half circle',
    guard: 'THE PICTURE: from the lead edge it flies straight until it is well into the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (turned < m.sweep && (turned > 0 || depth >= m.after)) {\n          const step = Math.min(speed / m.radius, m.sweep - turned);',
      replace: '        if (turned > 0 || depth >= m.after) {\n          const step = speed / m.radius;',
    },
  },
  {
    decision: '0328',
    suite: 'tests/swoop.test.ts',
    // Every arc dealt the same hand: a flanker from the acrossPlus edge turns AWAY from the edge it
    // came by and leaves by the far side rather than the way it came.
    broke: 'every arc dealt one hand, so a flanker from the far edge turns the wrong way',
    guard: 'and from the side it comes in, turns back toward the edge it came by',
    edit: {
      path: 'src/app/frame.ts',
      find: "    else if (row.motion.kind === 'arc') e.spin = flanking ? -side : target > ACROSS_SPAN / 2 ? 1 : -1;",
      replace: "    else if (row.motion.kind === 'arc') e.spin = 1;",
    },
  },
  {
    decision: '0328',
    suite: 'tests/swoop.test.ts',
    // The hull never turned to face its heading: a chevron leaves up-lane drawn nose-last.
    broke: 'the bitmap left facing down-lane while the body flies back up it',
    guard: 'and it faces the way it flies',
    edit: {
      path: 'src/app/frame.ts',
      find: '        e.turn = turnFor(Math.atan2(e.velAcross, e.velAlong - w.scrollPerStep));\n        break;',
      replace: '        break;',
    },
  },
  {
    decision: '0328',
    suite: 'tests/pilots.test.ts',
    // The swift put on a drift: the arc is a member of the union nothing flies.
    broke: 'the swift put on a drift, so the arc is an arm nothing flies',
    guard: 'has no arm nothing flies',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    motion: { kind: 'arc', radius: 25, sweep: Math.PI, after: 80 },",
      replace: "    motion: { kind: 'drift', roam: 0.2 },",
    },
  },
  {
    decision: '0328',
    suite: 'tests/level.test.ts',
    // A side-entering swift authored at lane 20: its U carries it fifty units back toward the edge
    // it came by, past the roam band, where the cull deletes it mid-turn.
    // ⚠️ Re-aimed by 0382, which made the guard read lanes in WORLD units: a share of 30 is 36
    // units across, and fifty back from there is still inside the band. Twenty is 24.
    broke: 'a flanking swift authored where its U leaves the roam band',
    guard: 'never puts an enemy where it can leave the ROAM band',
    edit: {
      path: 'src/content/levels.ts',
      find: "  { at: 1155, enemy: 'swift', formation: 'column', count: 5, lane: 50, origin: 'acrossMinus' },",
      replace: "  { at: 1155, enemy: 'swift', formation: 'column', count: 5, lane: 20, origin: 'acrossMinus' },",
    },
  },
];
